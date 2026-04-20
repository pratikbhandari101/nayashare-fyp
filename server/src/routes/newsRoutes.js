import { Router } from "express";
import { getHybridNews } from "../controllers/newsController.js";

export const newsRouter = Router();

newsRouter.get("/", getHybridNews);
