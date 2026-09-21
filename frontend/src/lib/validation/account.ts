import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),

  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must have at least 2 characters.")
    .max(50, "First name is too long."),

  lastName: z
    .string()
    .trim()
    .min(2, "Last name must have at least 2 characters.")
    .max(50, "Last name is too long."),

  email: z.string().trim().email("Enter a valid email address."),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters.")
    .regex(/[A-Z]/, "Password needs at least one uppercase letter.")
    .regex(/[0-9]/, "Password needs at least one number."),

  agreed: z.boolean().refine((value) => value === true, {
    message: "You must agree to the Terms & Conditions.",
  }),
});

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your name.")
    .max(100, "Name is too long."),

  email: z.string().trim().email("Enter a valid email address."),

  message: z
    .string()
    .trim()
    .min(10, "Message must contain at least 10 characters.")
    .max(2000, "Message must be 2000 characters or fewer."),

  agreed: z.boolean().refine((value) => value === true, {
    message: "Please agree to be contacted about your message.",
  }),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),

  password: z.string().min(1, "Enter the admin password."),
});
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must contain at least 8 characters.")
      .regex(/[A-Z]/, "Password needs at least one uppercase letter.")
      .regex(/[0-9]/, "Password needs at least one number."),

    confirmPassword: z.string().min(1, "Re-enter your new password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });