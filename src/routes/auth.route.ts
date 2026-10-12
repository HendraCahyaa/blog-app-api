import express from "express";
import {
  changePasswordController,
  forgotPasswordController,
  googleController,
  loginController,
  registerController,
  resetPasswordController,
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  googleSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const authRoutes = express.Router();
authRoutes.post("/register", validate(registerSchema), registerController);
authRoutes.post("/login", validate(loginSchema), loginController);
authRoutes.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPasswordController,
);
authRoutes.post(
  "/reset-password",
  verifyToken(process.env.JWT_SECRET_RESET!),
  validate(resetPasswordSchema),
  resetPasswordController,
);
authRoutes.post("/google", validate(googleSchema), googleController);
authRoutes.post(
  "/change-password",
  verifyToken(process.env.JWT_SECRET!),
  validate(changePasswordSchema),
  changePasswordController,
);
export { authRoutes };
