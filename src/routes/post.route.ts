import express from "express";
import {
  createPostControllers,
  getPostBySlugControllers,
  getPostControllers,
} from "../controllers/post.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { createPostSchema } from "../validators/post.validator.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const postRoutes = express.Router();
postRoutes.get("/", getPostControllers);
postRoutes.get("/:slug", getPostBySlugControllers);
postRoutes.post(
  "/",
  verifyToken(process.env.JWT_SECRET!),
  upload().fields([{ name: "thumbnail", maxCount: 1 }]),
  validate(createPostSchema),
  createPostControllers,
);

export { postRoutes };
