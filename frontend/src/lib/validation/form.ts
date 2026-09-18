import { z } from "zod";

const phonePattern = /^[0-9+\-\s()]{7,20}$/;

const optionalEmail = z
  .string()
  .trim()
  .refine(
    (value) => !value || z.string().email().safeParse(value).success,
    "Enter a valid email address.",
  );

const optionalWebsite = z
  .string()
  .trim()
  .refine(
    (value) =>
      !value ||
      z
        .string()
        .url("Enter a valid website URL.")
        .safeParse(value.startsWith("http") ? value : `https://${value}`)
        .success,
    "Enter a valid website URL.",
  );

const imageFile = z.custom<File | null>(
  (file) => {
    if (file === null) return true;
    if (!(file instanceof File)) return false;

    return (
      ["image/jpeg", "image/png", "image/webp"].includes(file.type) &&
      file.size <= 5 * 1024 * 1024
    );
  },
  "Use a JPG, PNG, or WebP image under 5 MB.",
);

export const listingSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(2, "Business name must have at least 2 characters.")
      .max(100, "Business name cannot exceed 100 characters."),

    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1,000 characters."),

    category: z.string().min(1, "Select a category."),

    bannerImage: imageFile,
    businessPhoto: imageFile,

    galleryPhotos: z
      .array(imageFile)
      .max(8, "You can upload up to 8 gallery images."),

    localAddress: z
      .string()
      .trim()
      .min(5, "Enter a complete local address.")
      .max(200, "Address cannot exceed 200 characters."),

    mapAddress: z
      .string()
      .trim()
      .min(3, "Search for and select the business location."),

    latitude: z.number().finite().optional(),
    longitude: z.number().finite().optional(),

    phone: z
      .string()
      .trim()
      .regex(phonePattern, "Enter a valid phone number."),

    whatsapp: z
      .string()
      .trim()
      .refine(
        (value) => !value || phonePattern.test(value),
        "Enter a valid WhatsApp number.",
      ),

    email: optionalEmail,
    website: optionalWebsite,

    services: z.array(z.string()).max(30),
    amenities: z.array(z.string()).max(20),

    openingHours: z.array(
      z.object({
        day: z.string(),
        open: z.string(),
        close: z.string(),
        closed: z.boolean(),
      }),
    ),

    parkingAvailable: z.boolean().nullable(),
    paymentMethods: z.array(z.string()).max(10),
  })
  .superRefine((data, context) => {
    if (data.latitude === undefined || data.longitude === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mapAddress"],
        message: "Select a location on the map before continuing.",
      });
    }

    data.openingHours.forEach((day, index) => {
      if (!day.closed && day.open >= day.close) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["openingHours", index, "close"],
          message: "Closing time must be after opening time.",
        });
      }
    });
  });

export const signupSchema = z
  .object({
    firstName: z.string().trim().min(2, "Enter your first name."),
    lastName: z.string().trim().min(2, "Enter your last name."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must have at least 8 characters.")
      .regex(/[A-Z]/, "Password needs one uppercase letter.")
      .regex(/[0-9]/, "Password needs one number."),
    confirmPassword: z.string(),
    agreed: z.literal(true, {
      errorMap: () => ({
        message: "You must accept the Terms & Conditions.",
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("Enter a valid email address."),
  message: z
    .string()
    .trim()
    .min(10, "Message must have at least 10 characters.")
    .max(1000, "Message cannot exceed 1,000 characters."),
  agreed: z.literal(true, {
    errorMap: () => ({
      message: "You must agree to be contacted.",
    }),
  }),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Choose a rating.").max(5),
  title: z
    .string()
    .trim()
    .min(3, "Review title must have at least 3 characters.")
    .max(100, "Review title cannot exceed 100 characters."),
  message: z
    .string()
    .trim()
    .min(10, "Review must have at least 10 characters.")
    .max(1000, "Review cannot exceed 1,000 characters."),
  firstName: z.string().trim().min(2, "Enter your first name."),
  lastName: z.string().trim().min(2, "Enter your last name."),
});

export const bookingSchema = z.object({
  firstName: z.string().trim().min(2, "Enter your first name."),
  lastName: z.string().trim().min(2, "Enter your last name."),
  phone: z
    .string()
    .trim()
    .regex(phonePattern, "Enter a valid phone number."),
  email: optionalEmail,
  service: z.string().min(1, "Select a service."),
  date: z.string().min(1, "Choose a preferred date."),
  timeWindow: z.string().min(1, "Choose a preferred time window."),
  agreed: z.literal(true, {
    errorMap: () => ({
      message: "You must agree to be contacted.",
    }),
  }),
});