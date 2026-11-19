import { describe, expect, it } from "vitest";
import { installSchema } from "@/lib/validation/install";

const valid = {
  setupCode: "a1b2c3d4e5f6a7b8",
  name: "Site Admin",
  email: "admin@example.com",
  password: "Secret123",
  confirmPassword: "Secret123",
};

function messages(input: unknown) {
  const result = installSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe("installSchema", () => {
  it("accepts a complete, valid form", () => {
    expect(installSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a setup code shorter than 16 characters", () => {
    expect(messages({ ...valid, setupCode: "short" })).toContain(
      "The setup code has at least 16 characters.",
    );
  });

  it("trims the setup code before checking its length", () => {
    expect(messages({ ...valid, setupCode: "   short   " })).toContain(
      "The setup code has at least 16 characters.",
    );
  });

  it("applies the same password rules as sign-up", () => {
    expect(messages({ ...valid, password: "short1A", confirmPassword: "short1A" })).toContain(
      "Password must contain at least 8 characters.",
    );
    expect(messages({ ...valid, password: "alllowercase1", confirmPassword: "alllowercase1" })).toContain(
      "Password needs at least one uppercase letter.",
    );
    expect(messages({ ...valid, password: "NoNumbersHere", confirmPassword: "NoNumbersHere" })).toContain(
      "Password needs at least one number.",
    );
  });

  it("rejects a password longer than 72 characters", () => {
    const long = "A1" + "a".repeat(71);
    expect(messages({ ...valid, password: long, confirmPassword: long })).toContain(
      "Password must be 72 characters or fewer.",
    );
  });

  it("requires the two passwords to match", () => {
    expect(messages({ ...valid, confirmPassword: "Different123" })).toContain(
      "Passwords do not match.",
    );
  });

  it("rejects an invalid email", () => {
    expect(messages({ ...valid, email: "not-an-email" })).toContain(
      "Enter a valid email address.",
    );
  });
});
