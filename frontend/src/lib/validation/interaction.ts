import { z } from "zod";

const phonePattern = /^[+0-9][0-9\s()-]{6,19}$/;

function todayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

export const bookingSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Enter your first name.")
    .max(50, "First name is too long."),

  lastName: z
    .string()
    .trim()
    .min(2, "Enter your last name.")
    .max(50, "Last name is too long."),

  phone: z
    .string()
    .trim()
    .regex(phonePattern, "Enter a valid phone number."),

  email: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.string().email().safeParse(value).success,
      "Enter a valid email address.",
    ),

  service: z.string().min(1, "Choose a service."),

  date: z
    .string()
    .min(1, "Choose a preferred date.")
    .refine((value) => value >= todayIsoDate(), "Choose today or a future date."),

  timeWindow: z.string().min(1, "Choose a preferred time window."),

  extra: z.record(z.string()),

  agreed: z.boolean().refine((value) => value === true, {
    message: "Please agree to be contacted about this booking.",
  }),
});

export const reviewSchema = z.object({
  rating: z
    .number()
    .min(1, "Choose a star rating.")
    .max(5, "Rating must be between 1 and 5."),

  title: z
    .string()
    .trim()
    .min(3, "Review title must have at least 3 characters.")
    .max(100, "Review title is too long."),

  message: z
    .string()
    .trim()
    .min(10, "Review must contain at least 10 characters.")
    .max(1000, "Review must be 1000 characters or fewer."),

  firstName: z
    .string()
    .trim()
    .min(2, "Enter your first name.")
    .max(50, "First name is too long."),

  lastName: z
    .string()
    .trim()
    .min(2, "Enter your last name.")
    .max(50, "Last name is too long."),
});