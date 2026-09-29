import express from "express";
import {
  getPostBySlugControllers,
  getPostControllers,
} from "../controllers/post.controller.js";

const postRoutes = express.Router();
postRoutes.get("/", getPostControllers);
postRoutes.get("/:slug", getPostBySlugControllers);

export { postRoutes };
