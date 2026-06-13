import { z } from "zod";

/** Registration input — shared by the tRPC `auth.register` procedure and the web kayıt form. */
export const registerSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
  firstName: z.string().min(1, "Ad gerekli"),
  lastName: z.string().min(1, "Soyad gerekli"),
  phone: z
    .string()
    .regex(/^[0-9+\s()-]{7,20}$/, "Geçerli bir telefon girin")
    .optional(),
  role: z.enum(["danisan", "egitmen"]),
});
export type RegisterInput = z.infer<typeof registerSchema>;

/** Login input. */
export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifre gerekli"),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Refresh-token exchange. */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof refreshSchema>;
