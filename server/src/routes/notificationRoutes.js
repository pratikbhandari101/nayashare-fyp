import { Router } from "express";
import { param } from "express-validator";
import {
  clearNotifications,
  getNotifications,
  markNotificationRead,
  markNotificationsRead
} from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const notificationRouter = Router();

notificationRouter.use(protect);

notificationRouter.get("/", getNotifications);
notificationRouter.patch("/read-all", markNotificationsRead);
notificationRouter.patch("/:id/read", [param("id").isMongoId().withMessage("Invalid notification id")], validate, markNotificationRead);
notificationRouter.delete("/", clearNotifications);
