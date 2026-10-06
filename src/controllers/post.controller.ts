import {
  createPostService,
  getPostBySlugService,
  getPostServices,
} from "../services/post.services.js";
import { Request, Response } from "express";

export const getPostControllers = async (req: Request, res: Response) => {
  const query = {
    page: parseInt(req.query.page as string) || 1,
    take: parseInt(req.query.take as string) || 3,
    sortOrder: (req.query.sortOrder as string) || "desc",
    sortBy: (req.query.sortBy as string) || "createAt",
    search: (req.query.search as string) || "",
  };
  const result = await getPostServices(query);
  res.status(200).send(result);
};

export const getPostBySlugControllers = async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const result = await getPostBySlugService(slug);
  res.status(200).send(result);
};
export const createPostControllers = async (req: Request, res: Response) => {
  const userId = res.locals.user.id;
  const files = req.files as { [fieldName: string]: Express.Multer.File[] };
  const thumbnail = files.thumbnail?.[0];
  const result = await createPostService(req.body, thumbnail, userId);
  res.status(200).send(result);
};
