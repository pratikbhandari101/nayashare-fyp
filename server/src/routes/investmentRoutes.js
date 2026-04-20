import { Router } from "express";
import { body, param } from "express-validator";
import {
  createInvestment,
  exitInvestment,
  myInvestmentTransactions,
  myInvestments
} from "../controllers/investmentController.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const investmentRouter = Router();

investmentRouter.use(protect);

investmentRouter.post(
  "/",
  authorize("investor", "founder"),
  [
    body("startupId").isMongoId().withMessage("Invalid startup id"),
    body("amount").isFloat({ min: 1 }).withMessage("Amount must be at least 1").toFloat()
  ],
  validate,
  createInvestment
);

investmentRouter.get("/me", authorize("investor", "founder"), myInvestments);
investmentRouter.get("/transactions/me", authorize("investor", "founder"), myInvestmentTransactions);
investmentRouter.post(
  "/:id/exit",
  authorize("investor", "founder"),
  [param("id").isMongoId().withMessage("Invalid investment id")],
  validate,
  exitInvestment
);
