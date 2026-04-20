import { Router } from "express";
import { getTodayWeather } from "../controllers/weatherController.js";

export const weatherRouter = Router();

weatherRouter.get("/today", getTodayWeather);
