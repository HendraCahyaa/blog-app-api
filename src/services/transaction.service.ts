import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { CreateTransactionSchema } from "../validators/transaction.validator.js";

export const createTransactionService = async (
  body: CreateTransactionSchema,
  userId: number,
) => {
  const product = await prisma.product.findUnique({
    where: { id: body.productId },
  });
  if (!product) {
    throw new ApiError("Product not found", 400);
  }
  if (product.stock < body.qty) {
    throw new ApiError("Insufficient stock", 400);
  }
  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        userId: userId,
        status: "WAITING_FOR_PAYMENT",
        productId: body.productId,
        qty: body.qty,
        price: product.price,
        expiredAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
      },
    });
    await tx.product.update({
      where: { id: body.productId },
      data: { stock: { decrement: body.qty } },
    });
  });
  return { message: "Transaction created success" };
};
