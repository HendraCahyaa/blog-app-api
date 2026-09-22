import { NextFunction, Request, Response } from "express";
import { ApiError } from "./api-error";

export const globalError = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const message = err.message || "something went wrong";
  const status = err.status || 500;

  return res.status(404).send({ message: "not found" });
};

export const notFoundError = (req: Request, res: Response) => {
  res.status(404).send({ message: "Route not found" });
};
