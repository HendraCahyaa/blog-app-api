import express from "express";
import {
  createUsercontroller,
  deleteUserController,
  editUserController,
  getUsersControllers,
} from "../controllers/user.controller.js";
import { getUserControllers } from "../controllers/user.controller.js";

const useRoutes = express.Router();
useRoutes.get("/", getUsersControllers);
useRoutes.get("/:id", getUserControllers);
useRoutes.post("/", createUsercontroller);
useRoutes.put("/:id", editUserController);
useRoutes.delete("/:id", deleteUserController);
export { useRoutes };
