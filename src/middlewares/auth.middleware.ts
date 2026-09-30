import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";
import jwt from "jsonwebtoken";

export const verifyToken = (secreetKey: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new ApiError("No token provided", 401);
    }
    try {
      const payload = jwt.verify(token, secreetKey);
      res.locals.user = payload;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return next(new ApiError("Token expired", 401));
      }
      return next(new ApiError("Token invalid", 401));
    }
  };
};
