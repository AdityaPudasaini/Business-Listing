import { describe, expect, it, vi, beforeEach } from "vitest";

// integration.ts reads env vars at import time, so each case re-imports it.
async function loadIntegration() {
  vi.resetModules();
  return import("@/config/integration");
}

describe("demo mode", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "");
  });

  it("is off when the API URL is missing and demo mode was not requested", async () => {
    const { isDemoMode, isBackendConfigured, assertDemoMode, BackendNotConfiguredError } =
      await loadIntegration();

    expect(isBackendConfigured).toBe(false);
    expect(isDemoMode).toBe(false);
    expect(() => assertDemoMode()).toThrow(BackendNotConfiguredError);
  });

  it("is on only when explicitly enabled and no API URL is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    const { isDemoMode, assertDemoMode } = await loadIntegration();

    expect(isDemoMode).toBe(true);
    expect(() => assertDemoMode()).not.toThrow();
  });

  it("stays off when an API URL is configured, even if the flag is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.test");
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    const { isDemoMode, isBackendConfigured } = await loadIntegration();

    expect(isBackendConfigured).toBe(true);
    expect(isDemoMode).toBe(false);
  });

  it("ignores values other than the exact string 'true'", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "yes");
    const { isDemoMode } = await loadIntegration();

    expect(isDemoMode).toBe(false);
  });
});
