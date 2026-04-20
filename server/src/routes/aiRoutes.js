import { Router } from "express";
import { getAISummary } from "../controllers/aiController.js";
import { authorize, protect } from "../middleware/auth.js";

export const aiRouter = Router();

aiRouter.post("/summary", protect, authorize("investor", "founder", "admin"), getAISummary);
