import express from "express";
import { registerController } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { registerSchema } from "../validators/auth.validator.js";

const authRoutes = express.Router();
authRoutes.post("/register", validate(registerSchema), registerController);
export { authRoutes };
