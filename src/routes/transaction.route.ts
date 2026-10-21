import { createTransactionController } from "../controllers/transaction.controller.js";
import express from "express";
import { verifyRole, verifyToken } from "../middlewares/auth.middleware.js";

import { createTransactionSchema } from "../validators/transaction.validator.js";
import { validate } from "../middlewares/validation.middleware.js";

const transactionRoutes = express.Router();
transactionRoutes.post(
  "/",
  verifyToken(process.env.JWT_SECRET!),
  verifyRole(["USER"]),
  validate(createTransactionSchema),
  createTransactionController,
);

export { transactionRoutes };
