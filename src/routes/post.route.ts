import express from "express";
import {
  createPostControllers,
  getPostBySlugControllers,
  getPostControllers,
} from "../controllers/post.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { createPostSchema } from "../validators/post.validator.js";

const postRoutes = express.Router();
postRoutes.get("/", getPostControllers);
postRoutes.get("/:slug", getPostBySlugControllers);
postRoutes.post("/", validate(createPostSchema), createPostControllers);

export { postRoutes };
