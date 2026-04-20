import { Router } from "express";
import { body, param } from "express-validator";
import {
  adminLogin,
  deleteUser,
  getAdminOverview,
  approveStartup,
  approvePerformanceUpdate,
  changeAdminPassword,
  listAllStartups,
  listPerformanceUpdates,
  listTransactionsForAdmin,
  listUsersForAdmin,
  rejectStartup,
  rejectPerformanceUpdate,
  suspendUser,
  unsuspendUser,
  updateStartupValuation
} from "../controllers/adminController.js";
import { adminLoginThrottle } from "../middleware/adminLoginGuard.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const adminRouter = Router();

adminRouter.post(
  "/login",
  adminLoginThrottle,
  [
    body("email").isEmail().normalizeEmail().withMessage("Enter a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
    body("accessKey").optional().isString().trim()
  ],
  validate,
  adminLogin
);

adminRouter.get("/startups", protect, authorize("admin"), listAllStartups);
adminRouter.get("/performance-updates", protect, authorize("admin"), listPerformanceUpdates);
adminRouter.get("/overview", protect, authorize("admin"), getAdminOverview);
adminRouter.get("/users", protect, authorize("admin"), listUsersForAdmin);
adminRouter.get("/transactions", protect, authorize("admin"), listTransactionsForAdmin);

adminRouter.put(
  "/startups/:id/approve",
  protect,
  authorize("admin"),
  [param("id").isMongoId().withMessage("Invalid startup id")],
  validate,
  approveStartup
);

adminRouter.put(
  "/startups/:id/reject",
  protect,
  authorize("admin"),
  [param("id").isMongoId().withMessage("Invalid startup id")],
  validate,
  rejectStartup
);

adminRouter.put(
  "/startups/:id/valuation",
  protect,
  authorize("admin"),
  [
    param("id").isMongoId().withMessage("Invalid startup id"),
    body("currentValuation").isFloat({ min: 0 }).withMessage("Current valuation must be 0 or more").toFloat()
  ],
  validate,
  updateStartupValuation
);

adminRouter.put(
  "/performance-updates/:id/approve",
  protect,
  authorize("admin"),
  [
    param("id").isMongoId().withMessage("Invalid performance update id"),
    body("adminNote").optional().trim().isLength({ max: 500 }).withMessage("Admin note is too long")
  ],
  validate,
  approvePerformanceUpdate
);

adminRouter.put(
  "/performance-updates/:id/reject",
  protect,
  authorize("admin"),
  [
    param("id").isMongoId().withMessage("Invalid performance update id"),
    body("adminNote").optional().trim().isLength({ max: 500 }).withMessage("Admin note is too long")
  ],
  validate,
  rejectPerformanceUpdate
);

adminRouter.put(
  "/users/:id/suspend",
  protect,
  authorize("admin"),
  [param("id").isMongoId().withMessage("Invalid user id")],
  validate,
  suspendUser
);

adminRouter.put(
  "/users/:id/unsuspend",
  protect,
  authorize("admin"),
  [param("id").isMongoId().withMessage("Invalid user id")],
  validate,
  unsuspendUser
);

adminRouter.delete(
  "/users/:id",
  protect,
  authorize("admin"),
  [param("id").isMongoId().withMessage("Invalid user id")],
  validate,
  deleteUser
);

adminRouter.put(
  "/change-password",
  protect,
  authorize("admin"),
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters")
  ],
  validate,
  changeAdminPassword
);
