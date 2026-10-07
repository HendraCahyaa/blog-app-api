import { z } from "zod";
export const registerSchema = z.object({
  name: z.string().min(3),
  email: z.email(),
  password: z
    .string()
    .min(6, { error: "Passowrd must be at least 6 character" })
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/^[A-Za-z0-9]/, {
      message: "Must containt at least code one special character",
    }),
});
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export const forgotPasswordSchema = z.object({
  email: z.email(),
});
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, { error: "Passowrd must be at least 6 character" })
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/^[A-Za-z0-9]/, {
      message: "Must containt at least code one special character",
    }),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
