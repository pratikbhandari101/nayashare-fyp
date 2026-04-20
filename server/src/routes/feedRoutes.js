import { Router } from "express";
import { body, param, query } from "express-validator";
import {
  addFeedComment,
  createPost,
  deletePost,
  deleteFeedComment,
  downvotePost,
  listFeedComments,
  listPosts,
  updatePost,
  upvotePost
} from "../controllers/feedController.js";
import { optionalProtect, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const feedRouter = Router();

feedRouter.get(
  "/",
  optionalProtect,
  [
    query("category").optional().trim().isLength({ max: 80 }).withMessage("Category is too long"),
    query("industry").optional().trim().isLength({ max: 120 }).withMessage("Industry is too long"),
    query("time").optional().isIn(["today", "week", "month"]).withMessage("Time filter is invalid")
  ],
  validate,
  listPosts
);

feedRouter.post(
  "/",
  protect,
  [
    body("content").trim().isLength({ min: 1, max: 280 }).withMessage("Content must be 1-280 characters"),
    body("image").optional({ values: "falsy" }).isString().withMessage("Image must be a string"),
    body("link").optional({ values: "falsy" }).isURL().withMessage("Link must be a valid URL"),
    body("category").optional().trim().isLength({ max: 80 }).withMessage("Category is too long"),
    body("industry").optional().trim().isLength({ max: 120 }).withMessage("Industry is too long")
  ],
  validate,
  createPost
);

feedRouter.put(
  "/:id",
  protect,
  [
    param("id").isMongoId().withMessage("Invalid post id"),
    body("content").trim().isLength({ min: 1, max: 280 }).withMessage("Content must be 1-280 characters"),
    body("image").optional({ values: "falsy" }).isString().withMessage("Image must be a string"),
    body("link").optional({ values: "falsy" }).isURL().withMessage("Link must be a valid URL"),
    body("category").optional().trim().isLength({ max: 80 }).withMessage("Category is too long"),
    body("industry").optional().trim().isLength({ max: 120 }).withMessage("Industry is too long")
  ],
  validate,
  updatePost
);

feedRouter.delete(
  "/:id",
  protect,
  [param("id").isMongoId().withMessage("Invalid post id")],
  validate,
  deletePost
);

feedRouter.post(
  "/:id/comments",
  protect,
  [
    param("id").isMongoId().withMessage("Invalid post id"),
    body("text").trim().isLength({ min: 1, max: 1000 }).withMessage("Comment must be between 1 and 1000 characters")
  ],
  validate,
  addFeedComment
);

feedRouter.get(
  "/:id/comments",
  optionalProtect,
  [param("id").isMongoId().withMessage("Invalid post id")],
  validate,
  listFeedComments
);

feedRouter.delete(
  "/:id/comments/:commentId",
  protect,
  [
    param("id").isMongoId().withMessage("Invalid post id"),
    param("commentId").isMongoId().withMessage("Invalid comment id")
  ],
  validate,
  deleteFeedComment
);

feedRouter.post(
  "/:id/upvote",
  protect,
  [param("id").isMongoId().withMessage("Invalid post id")],
  validate,
  upvotePost
);

feedRouter.post(
  "/:id/downvote",
  protect,
  [param("id").isMongoId().withMessage("Invalid post id")],
  validate,
  downvotePost
);
