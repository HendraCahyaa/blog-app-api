import express from "express";
import {
  createUsercontroller,
  deleteUserController,
  editUserController,
  getUserControllers,
  getUsersControllers,
  samplecontroller,
} from "../controllers/user.controller.js";

const useRoutes = express.Router();
useRoutes.get("/", getUsersControllers);
useRoutes.get("/samples", samplecontroller);
useRoutes.get("/:id", getUserControllers);
useRoutes.post("/", createUsercontroller);
useRoutes.put("/:id", editUserController);
useRoutes.delete("/:id", deleteUserController);
export { useRoutes };
