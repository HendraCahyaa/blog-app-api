import express from "express";
import { getBlogsControllers } from "../controllers/blog.controller.js";

const useRoutes = express.Router();
useRoutes.get("/blogs", getBlogsControllers);
export { useRoutes };
