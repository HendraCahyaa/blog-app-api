import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";
import { ZodError, ZodType } from "zod";

export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues
          .map((issue) => `${issue.path.join(".")} : ${issue.message}`)
          .join(",");

        return next(new ApiError(message, 400));
      }
      next(error);
    }
  };
};
