import { z } from "zod";
export const createPostSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  category: z.string().min(1),
  thumbnail: z.string().min(1),
  userId: z.number(),
  content: z.string().min(1),
});
export type CreatePostSchema = z.infer<typeof createPostSchema>;
