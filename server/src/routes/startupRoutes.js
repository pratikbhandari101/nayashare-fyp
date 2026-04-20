import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  addStartupComment,
  createStartup,
  deleteStartup,
  getStartup,
  likeStartup,
  listStartups,
  myStartups,
  savedStartups,
  saveStartup,
  submitStartupPerformanceUpdate,
  startupInvestments,
  unlikeStartup,
  unsaveStartup,
  updateStartup
} from "../controllers/startupController.js";
import {
  isValidCityForDistrict,
  isValidDistrictForProvince,
  isValidProvince,
  normalizeStructuredValue
} from "../utils/startupMetadata.js";
import { optionalProtect, authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const startupRouter = Router();

function isSupportedAssetReference(value) {
  if (!value) {
    return true;
  }

  return /^https?:\/\//i.test(value) || /^data:[^;]+;base64,/i.test(value);
}

const createStartupRequiredValidation = [
  body().custom((value, { req }) => {
    const name = req.body.basicInfo?.name ?? req.body.name;
    const description = req.body.basicInfo?.description ?? req.body.description;
    const fundingGoal = req.body.funding?.goal ?? req.body.fundingGoal;

    if (!name) {
      throw new Error("Name is required");
    }

    if (!description) {
      throw new Error("Description is required");
    }

    if (fundingGoal === undefined || fundingGoal === null || fundingGoal === "") {
      throw new Error("Funding goal is required");
    }

    return true;
  })
];

const sharedStartupValidation = [
  body("basicInfo").optional().isObject().withMessage("basicInfo must be an object"),
  body("classification").optional().isObject().withMessage("classification must be an object"),
  body("problem").optional().isObject().withMessage("problem must be an object"),
  body("business").optional().isObject().withMessage("business must be an object"),
  body("funding").optional().isObject().withMessage("funding must be an object"),
  body("financials").optional().isObject().withMessage("financials must be an object"),
  body("traction").optional().isObject().withMessage("traction must be an object"),
  body("valuation").optional().isObject().withMessage("valuation must be an object"),
  body("team").optional().isObject().withMessage("team must be an object"),
  body("media").optional().isObject().withMessage("media must be an object"),
  body("name").optional().trim().isLength({ min: 2, max: 120 }).withMessage("Name must be 2-120 characters"),
  body("basicInfo.name").optional().trim().isLength({ min: 2, max: 120 }).withMessage("Name must be 2-120 characters"),
  body("basicInfo.tagline").optional().trim().isLength({ max: 240 }).withMessage("Tagline is too long"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 20, max: 2500 })
    .withMessage("Description must be 20-2500 characters"),
  body("basicInfo.description")
    .optional()
    .trim()
    .isLength({ min: 20, max: 2500 })
    .withMessage("Description must be 20-2500 characters"),
  body("category").optional().trim().isLength({ max: 80 }).withMessage("Category is too long"),
  body("classification.category").optional().trim().isLength({ max: 80 }).withMessage("Category is too long"),
  body("classification.industry").optional().trim().isLength({ max: 120 }).withMessage("Industry is too long"),
  body("classification.stage")
    .optional()
    .isIn(["idea", "prototype", "growth"])
    .withMessage("Stage must be idea, prototype, or growth"),
  body("classification.location.province").optional().trim().isLength({ max: 120 }).withMessage("Province is too long"),
  body("classification.location.district").optional().trim().isLength({ max: 120 }).withMessage("District is too long"),
  body("classification.location.city").optional().trim().isLength({ max: 120 }).withMessage("City is too long"),
  body("classification.location.province")
    .optional({ values: "falsy" })
    .customSanitizer((value) => normalizeStructuredValue(value))
    .custom((value) => isValidProvince(value))
    .withMessage("Province must be a valid Nepal province"),
  body("classification.location.district")
    .optional({ values: "falsy" })
    .customSanitizer((value, { req }) => {
      req.body.classification ??= {};
      req.body.classification.location ??= {};
      req.body.classification.location.province = normalizeStructuredValue(req.body.classification.location.province);
      return normalizeStructuredValue(value);
    })
    .custom((value, { req }) => isValidDistrictForProvince(req.body.classification?.location?.province, value))
    .withMessage("District must belong to the selected province"),
  body("classification.location.city")
    .optional({ values: "falsy" })
    .customSanitizer((value, { req }) => {
      req.body.classification ??= {};
      req.body.classification.location ??= {};
      req.body.classification.location.province = normalizeStructuredValue(req.body.classification.location.province);
      req.body.classification.location.district = normalizeStructuredValue(req.body.classification.location.district);
      return normalizeStructuredValue(value);
    })
    .custom((value, { req }) =>
      isValidCityForDistrict(req.body.classification?.location?.province, req.body.classification?.location?.district, value)
    )
    .withMessage("City must belong to the selected district"),
  body("problem.problemStatement").optional().trim().isLength({ max: 2500 }).withMessage("Problem statement is too long"),
  body("problem.solution").optional().trim().isLength({ max: 2500 }).withMessage("Solution is too long"),
  body("problem.uniqueValueProposition")
    .optional()
    .trim()
    .isLength({ max: 1500 })
    .withMessage("Unique value proposition is too long"),
  body("business.website").optional({ values: "falsy" }).isURL().withMessage("Website must be a valid URL"),
  body("business.socialLinks").optional().isArray().withMessage("Social links must be an array"),
  body("business.socialLinks.*").optional().isURL().withMessage("Each social link must be a valid URL"),
  body("fundingGoal")
    .optional()
    .isFloat({ min: 1 })
    .withMessage("Funding goal must be a positive number")
    .toFloat(),
  body("funding.goal")
    .optional()
    .isFloat({ min: 1 })
    .withMessage("Funding goal must be a positive number")
    .toFloat(),
  body("funding.equityOffered")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Equity offered must be between 0 and 100")
    .toFloat(),
  body("funding.deadline").optional().isISO8601().withMessage("Funding deadline must be a valid date").toDate(),
  body("financials.monthlyRevenue").optional().isFloat().withMessage("Monthly revenue must be a number").toFloat(),
  body("financials.yearlyRevenue").optional().isFloat().withMessage("Yearly revenue must be a number").toFloat(),
  body("financials.monthlyExpenses").optional().isFloat().withMessage("Monthly expenses must be a number").toFloat(),
  body("financials.profitMargin").optional().isFloat().withMessage("Profit margin must be a number").toFloat(),
  body("financials.burnRate").optional().isFloat().withMessage("Burn rate must be a number").toFloat(),
  body("financials.runwayMonths").optional().isFloat({ min: 0 }).withMessage("Runway months must be 0 or more").toFloat(),
  body("traction.users").optional().isFloat({ min: 0 }).withMessage("Users must be 0 or more").toFloat(),
  body("traction.revenue").optional().isFloat().withMessage("Traction revenue must be a number").toFloat(),
  body("traction.growthRate").optional().isFloat().withMessage("Growth rate must be a number").toFloat(),
  body("valuation.initialValuation")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Initial valuation must be 0 or more")
    .toFloat(),
  body("valuation.currentValuation")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Current valuation must be 0 or more")
    .toFloat(),
  body("valuation.valuationMode")
    .optional()
    .isIn(["auto", "manual"])
    .withMessage("Valuation mode must be auto or manual"),
  body("team.size").optional().isInt({ min: 0 }).withMessage("Team size must be 0 or more").toInt(),
  body("team.founders").optional().isArray().withMessage("Team founders must be an array"),
  body("team.founders.*").optional().isMongoId().withMessage("Each team founder must be a valid user id"),
  body("media.logo")
    .optional({ values: "falsy" })
    .custom((value) => isSupportedAssetReference(value))
    .withMessage("Logo must be a valid URL or uploaded asset"),
  body("media.coverImage")
    .optional({ values: "falsy" })
    .custom((value) => isSupportedAssetReference(value))
    .withMessage("Cover image must be a valid URL or uploaded asset"),
  body("media.pitchDeck")
    .optional({ values: "falsy" })
    .custom((value) => isSupportedAssetReference(value))
    .withMessage("Pitch deck must be a valid URL or uploaded asset"),
  body("media.documents").optional().isArray().withMessage("Documents must be an array"),
  body("media.documents.*")
    .optional()
    .custom((value) => isSupportedAssetReference(value))
    .withMessage("Each document must be a valid URL or uploaded asset"),
  body("images").optional().isArray({ max: 6 }).withMessage("Images must be an array with up to 6 URLs"),
  body("images.*")
    .optional()
    .custom((value) => isSupportedAssetReference(value))
    .withMessage("Each image must be a valid URL or uploaded asset"),
  body("category").optional().customSanitizer((value) => normalizeStructuredValue(value)),
  body("classification.category").optional().customSanitizer((value) => normalizeStructuredValue(value)),
  body("classification.industry").optional().customSanitizer((value) => normalizeStructuredValue(value))
];

const createStartupValidation = [...createStartupRequiredValidation, ...sharedStartupValidation];
const updateStartupValidation = sharedStartupValidation;

startupRouter.get(
  "/",
  optionalProtect,
  [
    query("search").optional().trim().isLength({ max: 120 }).withMessage("Search is too long"),
    query("category").optional().trim().isLength({ max: 80 }).withMessage("Category is too long"),
    query("category").optional().customSanitizer((value) => normalizeStructuredValue(value)),
    query("industry").optional().trim().isLength({ max: 120 }).withMessage("Industry is too long"),
    query("industry").optional().customSanitizer((value) => normalizeStructuredValue(value)),
    query("stage").optional().isIn(["idea", "prototype", "growth"]).withMessage("Stage must be idea, prototype, or growth"),
    query("location").optional().trim().isLength({ max: 120 }).withMessage("Location is too long"),
    query("province").optional().trim().isLength({ max: 120 }).withMessage("Province is too long"),
    query("province").optional().customSanitizer((value) => normalizeStructuredValue(value)),
    query("district").optional().trim().isLength({ max: 120 }).withMessage("District is too long"),
    query("district").optional().customSanitizer((value) => normalizeStructuredValue(value)),
    query("city").optional().trim().isLength({ max: 120 }).withMessage("City is too long"),
    query("city").optional().customSanitizer((value) => normalizeStructuredValue(value)),
    query("minFunding").optional().isFloat({ min: 0 }).withMessage("Minimum funding must be 0 or more").toFloat(),
    query("maxFunding").optional().isFloat({ min: 0 }).withMessage("Maximum funding must be 0 or more").toFloat(),
    query("growthRate").optional().isFloat().withMessage("Growth rate must be a number").toFloat(),
    query("status")
      .optional()
      .isIn(["pending", "active", "funded", "closed", "approved", "rejected"])
      .withMessage("Status is invalid"),
    query("sort").optional().isIn(["funded", "highest", "growth", "new"]).withMessage("Sort is invalid"),
    query("minProgress").optional().isInt({ min: 0, max: 100 }).withMessage("Progress must be 0-100")
  ],
  validate,
  listStartups
);

startupRouter.get("/founder/mine", protect, authorize("founder"), myStartups);
startupRouter.get("/saved/me", protect, savedStartups);
startupRouter.post(
  "/:id/performance-update",
  protect,
  authorize("founder"),
  [
    param("id").isMongoId().withMessage("Invalid startup id"),
    body("monthlyRevenue").isFloat({ min: 0 }).withMessage("Monthly revenue must be 0 or more").toFloat(),
    body("monthlyExpenses").isFloat({ min: 0 }).withMessage("Monthly expenses must be 0 or more").toFloat(),
    body("growthRate").isFloat().withMessage("Growth rate must be a number").toFloat()
  ],
  validate,
  submitStartupPerformanceUpdate
);

startupRouter.get(
  "/:id",
  optionalProtect,
  [param("id").isMongoId().withMessage("Invalid startup id")],
  validate,
  getStartup
);

startupRouter.post("/", protect, authorize("founder"), createStartupValidation, validate, createStartup);

startupRouter.put(
  "/:id",
  protect,
  authorize("founder"),
  [param("id").isMongoId().withMessage("Invalid startup id"), ...updateStartupValidation],
  validate,
  updateStartup
);

startupRouter.delete(
  "/:id",
  protect,
  authorize("founder"),
  [param("id").isMongoId().withMessage("Invalid startup id")],
  validate,
  deleteStartup
);

startupRouter.get(
  "/:startupId/investments",
  protect,
  authorize("founder"),
  [param("startupId").isMongoId().withMessage("Invalid startup id")],
  validate,
  startupInvestments
);

startupRouter.post(
  "/:id/like",
  protect,
  [param("id").isMongoId().withMessage("Invalid startup id")],
  validate,
  likeStartup
);

startupRouter.post(
  "/:id/unlike",
  protect,
  [param("id").isMongoId().withMessage("Invalid startup id")],
  validate,
  unlikeStartup
);

startupRouter.post(
  "/:id/save",
  protect,
  [param("id").isMongoId().withMessage("Invalid startup id")],
  validate,
  saveStartup
);

startupRouter.post(
  "/:id/unsave",
  protect,
  [param("id").isMongoId().withMessage("Invalid startup id")],
  validate,
  unsaveStartup
);

startupRouter.post(
  "/:id/comment",
  protect,
  [
    param("id").isMongoId().withMessage("Invalid startup id"),
    body("text")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Comment must be between 1 and 1000 characters")
  ],
  validate,
  addStartupComment
);
