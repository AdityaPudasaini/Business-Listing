import { describe, expect, it, vi } from "vitest";

// site.ts reads env vars at import time, so each case re-imports it.
async function loadSite() {
  vi.resetModules();
  return import("@/config/site");
}

describe("siteUrl", () => {
  it("uses NEXT_PUBLIC_SITE_URL without a trailing slash", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.example.test/");
    const { siteUrl, absoluteUrl } = await loadSite();

    expect(siteUrl).toBe("https://www.example.test");
    expect(absoluteUrl("listings")).toBe("https://www.example.test/listings");
  });

  it("falls back to localhost outside production", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    const { siteUrl } = await loadSite();

    expect(siteUrl).toBe("http://localhost:3000");
  });

  it("refuses to build for production without a site URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NODE_ENV", "production");

    await expect(loadSite()).rejects.toThrow(/NEXT_PUBLIC_SITE_URL is not set/);
  });
});
