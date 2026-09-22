import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

interface GetBlogsQuery {
  page: number;
  take: number;
  sortOrder: string;
  sortBy: string;
  search: string;
}

export const getBlogsServices = async (query: GetBlogsQuery) => {
  const { page, take, sortBy, sortOrder, search } = query;

  const whereClause: Prisma.BlogWhereInput = {};

  if (search) {
    whereClause.content = { contains: search, mode: "insensitive" };
  }

  console.log(
    "Isi Where Clause saat ini:",
    JSON.stringify(whereClause, null, 2),
  );

  const blogs = await prisma.blog.findMany({
    where: whereClause,
    include: {
      author: {
        select: { id: true, name: true, profilePic: true },
      },
    },
    skip: (page - 1) * take,
    take: take,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.blog.count({ where: whereClause });

  return {
    data: blogs,
    meta: {
      page,
      take,
      total,
    },
  };
};
