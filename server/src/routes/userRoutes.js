import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  followUser,
  getFollowers,
  getProfile,
  getFollowing,
  searchUsers,
  getUserProfile,
  unfollowUser,
  updateProfile,
  updateProfileImage
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import { uploadProfileImage } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";

export const userRouter = Router();

userRouter.use(protect);

userRouter.get("/profile", getProfile);
userRouter.get("/search", [query("q").optional().trim().isLength({ max: 120 }).withMessage("Search is too long")], validate, searchUsers);

userRouter.put(
  "/profile",
  uploadProfileImage.single("profileImage"),
  [
    body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters"),
    body("bio").optional().trim().isLength({ max: 160 }).withMessage("Bio must be 160 characters or fewer"),
    body("about").optional().trim().isLength({ max: 600 }).withMessage("About must be 600 characters or fewer"),
    body("website").optional({ checkFalsy: true }).isURL().withMessage("Website must be a valid URL"),
    body("contactEmail").optional({ checkFalsy: true }).isEmail().withMessage("Contact email must be valid"),
    body("contactPhone").optional().trim().isLength({ max: 40 }).withMessage("Phone must be 40 characters or fewer"),
    body("contactLocation").optional().trim().isLength({ max: 120 }).withMessage("Location must be 120 characters or fewer"),
    body("contactIsPublic").optional().isIn(["true", "false"]).withMessage("Contact visibility is invalid"),
    body("socialLinkedin").optional({ checkFalsy: true }).isURL().withMessage("LinkedIn link must be valid"),
    body("socialTwitter").optional({ checkFalsy: true }).isURL().withMessage("Twitter link must be valid"),
    body("socialGithub").optional({ checkFalsy: true }).isURL().withMessage("GitHub link must be valid"),
    body("socialInstagram").optional({ checkFalsy: true }).isURL().withMessage("Instagram link must be valid"),
    body("experienceEntries")
      .optional()
      .custom((value) => {
        const parsed = JSON.parse(value || "[]");
        if (!Array.isArray(parsed) || parsed.length > 8) {
          throw new Error("Experience must include up to 8 items");
        }
        return true;
      }),
    body("educationEntries")
      .optional()
      .custom((value) => {
        const parsed = JSON.parse(value || "[]");
        if (!Array.isArray(parsed) || parsed.length > 8) {
          throw new Error("Education must include up to 8 items");
        }
        return true;
      }),
    body("languages")
      .optional()
      .custom((value) => {
        const parsed = JSON.parse(value || "[]");
        if (!Array.isArray(parsed) || parsed.length > 8) {
          throw new Error("Languages must be an array with up to 8 items");
        }
        return true;
      }),
    body("interests")
      .optional()
      .custom((value) => {
        const parsed = JSON.parse(value || "[]");
        if (!Array.isArray(parsed) || parsed.length > 5) {
          throw new Error("Interests must be an array with up to 5 items");
        }
        return true;
      }),
    body("gender").isIn(["male", "female", "other"]).withMessage("Gender must be male, female, or other"),
    body("dateOfBirth")
      .isISO8601()
      .withMessage("Date of birth must be a valid date")
      .toDate()
      .custom((value) => {
        if (value >= new Date()) {
          throw new Error("Date of birth must be in the past");
        }
        return true;
      })
  ],
  validate,
  updateProfile
);

userRouter.put("/profile-image", uploadProfileImage.single("profileImage"), updateProfileImage);

userRouter.post(
  "/:id/follow",
  [param("id").isMongoId().withMessage("Invalid user id")],
  validate,
  followUser
);

userRouter.post(
  "/:id/unfollow",
  [param("id").isMongoId().withMessage("Invalid user id")],
  validate,
  unfollowUser
);

userRouter.get(
  "/:id/followers",
  [param("id").isMongoId().withMessage("Invalid user id")],
  validate,
  getFollowers
);

userRouter.get(
  "/:id/following",
  [param("id").isMongoId().withMessage("Invalid user id")],
  validate,
  getFollowing
);

userRouter.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid user id")],
  validate,
  getUserProfile
);
