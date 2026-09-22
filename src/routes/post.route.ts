import express from "express";
import { getPostControllers } from "../controllers/post.controller.js";

const postRoutes = express.Router();
postRoutes.get("/", getPostControllers);

export { postRoutes };
