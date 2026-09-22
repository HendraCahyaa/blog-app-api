import { getPostServices } from "../services/post.services.js";
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
