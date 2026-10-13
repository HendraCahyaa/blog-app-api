import { Request, Response } from "express";
import {
  changePasswordService,
  forgotPasswordService,
  googleService,
  loginService,
  logoutService,
  refreshService,
  registerService,
  resetPasswordService,
} from "../services/auth.services.js";
import { cookieOptions } from "../config/cookie.js";
export const registerController = async (req: Request, res: Response) => {
  const result = await registerService(req.body);
  res.status(200).send(result);
};
export const loginController = async (req: Request, res: Response) => {
  const result = await loginService(req.body);

  res.cookie("accessToken", result.accessToken, cookieOptions);
  res.cookie("refreshToken", result.refreshToken, cookieOptions);
  res.status(200).send(result);
};
export const forgotPasswordController = async (req: Request, res: Response) => {
  const result = await forgotPasswordService(req.body);
  res.status(200).send(result);
};
export const resetPasswordController = async (req: Request, res: Response) => {
  const userId = res.locals.user.id;
  const result = await resetPasswordService(req.body, userId);
  res.status(200).send(result);
};
export const googleController = async (req: Request, res: Response) => {
  const result = await googleService(req.body);
  res.status(200).send(result);
};
export const changePasswordController = async (req: Request, res: Response) => {
  const userId = res.locals.user.id;
  const result = await changePasswordService(req.body, userId);
  res.status(200).send(result);
};
export const refreshController = async (req: Request, res: Response) => {
  const result = await refreshService(req.cookies.refreshToken);
  res.cookie("accessToken", result.accessToken, cookieOptions);
  res.status(200).send({ message: "refresh success" });
};
export const logoutController = async (req: Request, res: Response) => {
  const result = await logoutService(req.cookies.refreshToken);

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
  res.status(200).send(result);
};
