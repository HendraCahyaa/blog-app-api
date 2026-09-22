import { getBlogsServices } from "../services/blog.services.js";
import { Request, Response } from "express";

export const getBlogsControllers = async (req: Request, res: Response) => {
  const query = {
    page: parseInt(req.query.page as string) || 1,
    take: parseInt(req.query.take as string) || 3,
    sortOrder: (req.query.sortOrder as string) || "desc",
    sortBy: (req.query.sortBy as string) || "createdAt",
    search: (req.query.search as string) || "",
  };
  const result = await getBlogsServices(query);
  res.status(200).send(result);
};
