// install.ts -- validation for the first-run /install form.
// Mirrors the backend's InstallDto (setup code 16-128 chars, name 1-100, email, password rules).
import { z } from "zod";

export const installSchema = z
  .object({
    setupCode: z
      .string()
      .trim()
      .min(16, "The setup code has at least 16 characters.")
      .max(128, "The setup code is too long."),

    name: z
      .string()
      .trim()
      .min(2, "Name must have at least 2 characters.")
      .max(100, "Name is too long."),

    email: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .max(254, "Email is too long."),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters.")
      .max(72, "Password must be 72 characters or fewer.")
      .regex(/[A-Z]/, "Password needs at least one uppercase letter.")
      .regex(/[0-9]/, "Password needs at least one number."),

    confirmPassword: z.string().min(1, "Re-enter your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type InstallValues = z.infer<typeof installSchema>;
