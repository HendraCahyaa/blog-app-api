import express from "express";
import {
  createPostControllers,
  getPostBySlugControllers,
  getPostControllers,
} from "../controllers/post.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { createPostSchema } from "../validators/post.validator.js";
import { verifyRole, verifyToken } from "../middlewares/auth.middleware.js";
import { fileFilter, upload } from "../middlewares/upload.middleware.js";

const postRoutes = express.Router();
postRoutes.get("/", getPostControllers);
postRoutes.get("/:slug", getPostBySlugControllers);
postRoutes.post(
  "/",
  verifyToken(process.env.JWT_SECRET!),
  verifyRole(["USER"]),
  upload().fields([{ name: "thumbnail", maxCount: 1 }]),
  fileFilter(["image/jpeg", "image/avif", "image/png", "image/webp"]),
  validate(createPostSchema),
  createPostControllers,
);

export { postRoutes };
