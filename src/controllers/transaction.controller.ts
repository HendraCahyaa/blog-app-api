import { Request, Response } from "express";
import { createTransactionService } from "../services/transaction.service.js";

export const createTransactionController = async (
  req: Request,
  res: Response,
) => {
  const userId = res.locals.user.id;
  const result = await createTransactionService(req.body, userId);
  res.status(200).send(result);
};
