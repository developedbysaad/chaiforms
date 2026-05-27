import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(1, "Name is required").max(120),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200, "Password too long"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
