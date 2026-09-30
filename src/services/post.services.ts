import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { paginationQueryParams } from "../types/pagination.js";
import { ApiError } from "../utils/api-error.js";
import { generateSlug } from "../utils/slug.js";
import { CreatePostSchema } from "../validators/post.validator.js";

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
    include: { user: { select: { name: true } } },
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

export const getPostBySlugService = async (slug: string) => {
  const blog = await prisma.post.findUnique({
    where: { slug },
    include: { user: { select: { name: true } } },
  });

  if (!blog) {
    throw new ApiError("Blog not found", 404);
  }
  return blog;
};

export const createPostService = async (body: CreatePostSchema) => {
  const blog = await prisma.post.findUnique({
    where: { title: body.title },
  });
  if (blog) {
    throw new ApiError("Title already exist", 400);
  }
  const slug = generateSlug(body.title);

  await prisma.post.create({
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      slug: slug,
      content: body.content,
      thumbnail: body.thumbnail,
      userId: body.userId,
    },
  });
  return { message: "create post success" };
};
