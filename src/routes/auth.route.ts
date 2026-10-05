import express from "express";
import {
  loginController,
  registerController,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const authRoutes = express.Router();
authRoutes.post("/register", validate(registerSchema), registerController);
authRoutes.post("/login", validate(loginSchema), loginController);
export { authRoutes };
