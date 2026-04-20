import { Router } from "express";
import { body } from "express-validator";
import {
  esewaFailure,
  esewaSuccess,
  initiateEsewaPayment,
  myPayments
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const paymentRouter = Router();

paymentRouter.post(
  "/esewa/initiate",
  protect,
  [body("amount").isFloat({ min: 100 }).withMessage("Amount must be at least NPR 100").toFloat()],
  validate,
  initiateEsewaPayment
);

paymentRouter.get("/me", protect, myPayments);
paymentRouter.get("/esewa/success", esewaSuccess);
paymentRouter.get("/esewa/failure", esewaFailure);
