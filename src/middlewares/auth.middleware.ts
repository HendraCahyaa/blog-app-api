import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";
import jwt from "jsonwebtoken";
import { UserRole } from "../../generated/prisma/enums.js";
import { error } from "node:console";

export const verifyToken = (secreetKey: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken;

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
export const verifyRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const UserRole = res.locals.user.role;

    if (!UserRole || !roles.includes(UserRole)) {
      throw new ApiError("You dont have access", 403);
    }
    next();
  };
};
