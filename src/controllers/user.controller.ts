import {
  createUserService,
  deleteUserService,
  editUserService,
  getUsersServices,
} from "../services/user.services.js";
import { getUserServices } from "../services/user.services.js";
import { Request, Response } from "express";

export const getUsersControllers = async (req: Request, res: Response) => {
  const query = {
    page: parseInt(req.query.page as string) || 1,
    take: parseInt(req.query.take as string) || 3,
    sortOrder: (req.query.sortOrder as string) || "desc",
    sortBy: (req.query.sortBy as string) || "createAt",
    search: (req.query.search as string) || "",
  };
  const result = await getUsersServices(query);
  res.status(200).send(result);
};
export const getUserControllers = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await getUserServices(id);
  res.status(200).send(result);
};

export const createUsercontroller = async (req: Request, res: Response) => {
  const result = await createUserService(req.body);
  res.status(200).send(result);
};

export const editUserController = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await editUserService(id, req.body);
  res.status(200).send(result);
};

export const deleteUserController = async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  const result = await deleteUserService(userId);
  res.status(200).send(result);
};
