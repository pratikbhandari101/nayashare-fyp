import cors from "cors";
import "./config/env.js";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { uploadRoot } from "./middleware/upload.js";
import { adminRouter } from "./routes/adminRoutes.js";
import { aiRouter } from "./routes/aiRoutes.js";
import { authRouter } from "./routes/authRoutes.js";
import { feedRouter } from "./routes/feedRoutes.js";
import { investmentRouter } from "./routes/investmentRoutes.js";
import { newsRouter } from "./routes/newsRoutes.js";
import { notificationRouter } from "./routes/notificationRoutes.js";
import { paymentRouter } from "./routes/paymentRoutes.js";
import { startupRouter } from "./routes/startupRoutes.js";
import { userRouter } from "./routes/userRoutes.js";
import { weatherRouter } from "./routes/weatherRoutes.js";

export const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json({ limit: "8mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/uploads", express.static(uploadRoot));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/ai", aiRouter);
app.use("/api/admin", adminRouter);
app.use("/api/feed", feedRouter);
app.use("/api/startups", startupRouter);
app.use("/api/investments", investmentRouter);
app.use("/api/news", newsRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/users", userRouter);
app.use("/api/weather", weatherRouter);

app.use(notFound);
app.use(errorHandler);
