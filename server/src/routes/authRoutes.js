import { Router } from "express";
import { body } from "express-validator";
import {
  googleAuth,
  googleRegister,
  forgotPassword,
  login,
  logout,
  me,
  register,
  resetPassword,
  sendVerification,
  verifyEmail
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Enter a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").optional().isIn(["investor", "founder"]).withMessage("Role must be investor or founder"),
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
  register
);

authRouter.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Enter a valid email"),
    body("password").notEmpty().withMessage("Password is required")
  ],
  validate,
  login
);

authRouter.post(
  "/send-verification",
  [body("email").isEmail().normalizeEmail().withMessage("Enter a valid email")],
  validate,
  sendVerification
);

authRouter.post(
  "/verify-email",
  [
    body("email").isEmail().normalizeEmail().withMessage("Enter a valid email"),
    body("otp").isLength({ min: 6, max: 6 }).isNumeric().withMessage("Enter the 6-digit OTP")
  ],
  validate,
  verifyEmail
);

authRouter.post(
  "/google",
  [
    body().custom((value) => {
      if (!value.credential && !value.token) {
        throw new Error("Google credential is required");
      }
      return true;
    }),
  ],
  validate,
  googleAuth
);

authRouter.post(
  "/google-register",
  [
    body("email").isEmail().normalizeEmail().withMessage("Enter a valid email"),
    body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters"),
    body().custom((value) => {
      const role = value.role || value.selectedRole;
      if (!["investor", "founder"].includes(role)) {
        throw new Error("Role must be investor or founder");
      }
      return true;
    }),
    body("googleRegistrationToken").notEmpty().withMessage("Google registration session is required")
  ],
  validate,
  googleRegister
);

authRouter.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail().withMessage("Enter a valid email")],
  validate,
  forgotPassword
);

authRouter.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
  ],
  validate,
  resetPassword
);

authRouter.post("/logout", protect, logout);
authRouter.get("/me", protect, me);
