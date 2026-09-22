import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { paginationQueryParams } from "../types/pagination.js";

export const getPostServices = async (query: paginationQueryParams) => {
  const { page, take, sortBy, sortOrder, search } = query;
  const whereClause: Prisma.PostWhereInput = {};

  if (search) {
    whereClause.user = {
      email: { contains: search, mode: "insensitive" },
    };
  }
  const posts = await prisma.post.findMany({
    where: whereClause,
    skip: (page - 1) * take,
    take: take,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.post.count({ where: whereClause });
  return {
    data: posts,
    meta: {
      page,
      take,
      total,
    },
  };
};
