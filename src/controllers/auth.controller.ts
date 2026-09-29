import { Request, Response } from "express";
import { registerService } from "../services/auth.services.js";
export const registerController = async (req: Request, res: Response) => {
  const result = await registerService(req.body);
  res.status(200).send(result);
};
