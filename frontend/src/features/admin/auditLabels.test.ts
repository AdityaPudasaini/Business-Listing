import { describe, expect, it } from "vitest";
import { describeActor, describeEvent, metadataLines } from "@/features/admin/auditLabels";

describe("describeEvent", () => {
  it("uses a plain label for known actions", () => {
    expect(describeEvent({ action: "auth.account_locked", metadata: null })).toEqual({
      label: "Account locked after failed sign-ins",
      tone: "bad",
    });
  });

  it("reads the new role and ban state from metadata", () => {
    expect(describeEvent({ action: "user.role_changed", metadata: { role: "admin" } }).label).toBe(
      "User made an admin",
    );
    expect(describeEvent({ action: "user.role_changed", metadata: { role: "user" } }).label).toBe(
      "Admin access removed",
    );
    expect(describeEvent({ action: "user.ban_changed", metadata: { isBanned: true } }).label).toBe(
      "User banned",
    );
    expect(describeEvent({ action: "user.ban_changed", metadata: { isBanned: false } }).label).toBe(
      "User unbanned",
    );
  });

  it("names the social provider", () => {
    expect(describeEvent({ action: "auth.social_login", metadata: { provider: "google" } }).label).toBe(
      "Signed in with Google",
    );
  });

  it("falls back to a readable version of unknown actions", () => {
    expect(describeEvent({ action: "thing.did_something", metadata: null }).label).toBe(
      "thing did something",
    );
  });
});

describe("describeActor", () => {
  it("prefers the account name and email", () => {
    expect(
      describeActor({ userId: "u1", userName: "Asha", userEmail: "asha@example.com", metadata: null }),
    ).toEqual({ primary: "Asha", secondary: "asha@example.com" });
  });

  it("shows the attempted email for a failed sign-in on an unknown account", () => {
    expect(
      describeActor({ userId: null, userName: "", userEmail: "", metadata: { email: "who@example.com" } }),
    ).toEqual({ primary: "Unknown account", secondary: "Tried who@example.com" });
  });

  it("marks entries whose account no longer exists", () => {
    expect(describeActor({ userId: "gone", userName: "", userEmail: "", metadata: null }).primary).toBe(
      "Deleted account",
    );
  });
});

describe("metadataLines", () => {
  it("leaves the email out because it is shown in the Who column", () => {
    expect(metadataLines({ metadata: { email: "a@b.com", role: "admin" } })).toEqual(["role: admin"]);
  });
});
