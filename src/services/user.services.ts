import { Prisma, User } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";

interface GetUsersQuery {
  page: number;
  take: number;
  sortOrder: string; //asc or desc
  sortBy: string; //based on column
  search: string;
}

export const getUsersServices = async (query: GetUsersQuery) => {
  const { page, take, sortBy, sortOrder, search } = query;

  const whereClause: Prisma.UserWhereInput = {
    deleteAt: null,
  };

  if (search) {
    whereClause.email = { contains: search, mode: "insensitive" };
  }
  console.log(
    "Isi Where Clause saat ini:",
    JSON.stringify(whereClause, null, 2),
  );

  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      posts: {
        select: { id: true, content: true },
      },
    },
    skip: (page - 1) * take,
    take: take,
    orderBy: { [sortBy]: sortOrder },
    omit: { password: true },
  });

  const total = await prisma.user.count({ where: whereClause });
  return {
    data: users,
    meta: {
      page,
      take,
      total,
    },
  };
};
export const getUserServices = async (id: number) => {
  const user = await prisma.user.findUnique({ where: { id: id } });
  if (!user) {
    throw new ApiError("User not found", 404);
  }
  return user;
};

export const createUserService = async (body: User) => {
  await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({ data: body });
    await tx.post.create({
      data: { content: "lorem ipsum", userId: newUser.id },
    });
  });

  return { message: "create user success" };
};

export const editUserService = async (id: number, body: Partial<User>) => {
  await getUserServices(id);
  await prisma.user.update({ where: { id: id }, data: body });

  return { message: "update user success" };
};
export const deleteUserService = async (id: number) => {
  await getUserServices(id);
  //soft delete => data tidak benar benar hilang tapi mengisi kolom deleteAt
  await prisma.user.update({
    where: { id: id },
    data: { deleteAt: new Date() },
  });
  //hard delete => data benar benar hilang di database
  // await prisma.user.delete({ where: { id: id } });

  return { message: "Delete user success" };
};
