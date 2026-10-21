import { z } from "zod";
export const createTransactionSchema = z.object({
  productId: z.number().int().positive(),
  qty: z.number().int().positive(),
});
export type CreateTransactionSchema = z.infer<typeof createTransactionSchema>;
