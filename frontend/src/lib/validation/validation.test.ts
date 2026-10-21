import { describe, expect, it } from "vitest";
import {
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from "@/lib/validation/account";
import { bookingSchema, reviewSchema } from "@/lib/validation/interaction";

function isoDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split("T")[0];
}

const validBooking = {
  firstName: "Sujata",
  lastName: "Karki",
  phone: "+977 9812345678",
  email: "",
  service: "oil-change",
  date: isoDate(1),
  timeWindow: "morning",
  extra: {},
  agreed: true,
};

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });
});

describe("signupSchema", () => {
  const valid = {
    firstName: "Bibek",
    lastName: "Thapa",
    email: "bibek@example.test",
    password: "Garage2024",
    agreed: true,
  };

  it("accepts a valid signup", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["too short", "Ab1"],
    ["no uppercase letter", "garage2024"],
    ["no number", "GarageShop"],
  ])("rejects a password with %s", (_label, password) => {
    expect(signupSchema.safeParse({ ...valid, password }).success).toBe(false);
  });

  it("requires agreeing to the terms", () => {
    expect(signupSchema.safeParse({ ...valid, agreed: false }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("flags mismatched passwords on confirmPassword", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Garage2024",
      confirmPassword: "Garage2025",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
  });
});

describe("bookingSchema", () => {
  it("accepts a valid booking with no email", () => {
    expect(bookingSchema.safeParse(validBooking).success).toBe(true);
  });

  it("accepts today as the booking date", () => {
    expect(bookingSchema.safeParse({ ...validBooking, date: isoDate(0) }).success).toBe(true);
  });

  it("rejects a date in the past", () => {
    expect(bookingSchema.safeParse({ ...validBooking, date: isoDate(-1) }).success).toBe(false);
  });

  it("rejects a malformed email but allows an empty one", () => {
    expect(bookingSchema.safeParse({ ...validBooking, email: "nope" }).success).toBe(false);
  });

  it("rejects an invalid phone number", () => {
    expect(bookingSchema.safeParse({ ...validBooking, phone: "12" }).success).toBe(false);
  });
});

describe("reviewSchema", () => {
  const valid = {
    rating: 4,
    title: "Quick service",
    message: "Changed my oil in twenty minutes.",
    firstName: "Rojina",
    lastName: "Shrestha",
  };

  it("accepts a valid review", () => {
    expect(reviewSchema.safeParse(valid).success).toBe(true);
  });

  it("requires a star rating", () => {
    expect(reviewSchema.safeParse({ ...valid, rating: 0 }).success).toBe(false);
  });
});
