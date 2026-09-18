import { z } from "zod";

const phonePattern = /^[+0-9][0-9\s()-]{6,19}$/;

const optionalEmail = z.string().trim().refine(
  (value) => value === "" || z.string().email().safeParse(value).success,
  "Enter a valid email address.",
);

const optionalWebsite = z.string().trim().refine(
  (value) =>
    value === "" ||
    /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(value),
  "Enter a complete website URL, for example https://example.com.",
);

const imageFile = z
  .custom<File | null>(
    (value) =>
      value === null ||
      (typeof File !== "undefined" && value instanceof File),
    "Please choose a valid image file.",
  )
  .refine(
    (file) =>
      file === null ||
      ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    "Use a JPG, PNG, or WebP image.",
  )
  .refine(
    (file) => file === null || file.size <= 5 * 1024 * 1024,
    "Images must be smaller than 5 MB.",
  );

export const listingSchema = z
  .object({
    businessName: z
      .string()
      .trim()
      .min(2, "Enter a business name with at least 2 characters.")
      .max(100, "Business name must be 100 characters or fewer."),

    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters.")
      .max(1000, "Description must be 1000 characters or fewer."),

    category: z.string().min(1, "Choose a business category."),

    bannerImage: imageFile,
    businessPhoto: imageFile,

    galleryPhotos: z
      .array(imageFile)
      .max(10, "You can upload a maximum of 10 gallery images."),

    localAddress: z
      .string()
      .trim()
      .min(5, "Enter your full local address."),

    mapAddress: z
      .string()
      .trim()
      .min(3, "Search for and select a location on the map."),

    latitude: z.number({
      required_error: "Choose an exact location on the map.",
      invalid_type_error: "Choose an exact location on the map.",
    }),

    longitude: z.number({
      required_error: "Choose an exact location on the map.",
      invalid_type_error: "Choose an exact location on the map.",
    }),

    phone: z
      .string()
      .trim()
      .regex(phonePattern, "Enter a valid phone number."),

    whatsapp: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || phonePattern.test(value),
        "Enter a valid WhatsApp number.",
      ),

    email: optionalEmail,
    website: optionalWebsite,

    services: z.array(z.string()),

    openingHours: z.array(
      z.object({
        day: z.string(),
        open: z.string(),
        close: z.string(),
        closed: z.boolean(),
      }),
    ),

    amenities: z.array(z.string()),
    parkingAvailable: z.boolean().nullable(),
    paymentMethods: z.array(z.string()),
  })
  .superRefine((values, context) => {
    values.openingHours.forEach((day, index) => {
      if (!day.closed && day.open >= day.close) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["openingHours", index, "close"],
          message: `${day.day}: closing time must be after opening time.`,
        });
      }
    });
  });