import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type AnalyticsConfig,
  getAnalyticsConfig,
  isSensitivePath,
  trackEvent,
} from "@/lib/analytics";

const GA: AnalyticsConfig = {
  provider: "ga4",
  gaMeasurementId: "G-TEST123456",
  plausibleDomain: "",
  plausibleSrc: "",
};

describe("getAnalyticsConfig", () => {
  it("is off when nothing is configured", () => {
    expect(getAnalyticsConfig({}).provider).toBe("none");
  });

  it("accepts a valid GA4 measurement id", () => {
    const config = getAnalyticsConfig({
      NEXT_PUBLIC_ANALYTICS_PROVIDER: "ga4",
      NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-ABC123XYZ9",
    });
    expect(config.provider).toBe("ga4");
    expect(config.gaMeasurementId).toBe("G-ABC123XYZ9");
  });

  it("rejects a malformed GA4 id instead of putting it in a script URL", () => {
    expect(
      getAnalyticsConfig({
        NEXT_PUBLIC_ANALYTICS_PROVIDER: "ga4",
        NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-1');alert(1)//",
      }).provider,
    ).toBe("none");
  });

  it("needs a valid domain for Plausible", () => {
    expect(
      getAnalyticsConfig({ NEXT_PUBLIC_ANALYTICS_PROVIDER: "plausible" }).provider,
    ).toBe("none");
    expect(
      getAnalyticsConfig({
        NEXT_PUBLIC_ANALYTICS_PROVIDER: "plausible",
        NEXT_PUBLIC_PLAUSIBLE_DOMAIN: "example.com",
      }).provider,
    ).toBe("plausible");
  });

  it("only loads Plausible's script over https", () => {
    expect(
      getAnalyticsConfig({
        NEXT_PUBLIC_ANALYTICS_PROVIDER: "plausible",
        NEXT_PUBLIC_PLAUSIBLE_DOMAIN: "example.com",
        NEXT_PUBLIC_PLAUSIBLE_SRC: "http://insecure.example/script.js",
      }).provider,
    ).toBe("none");
  });

  it("ignores unknown providers", () => {
    expect(getAnalyticsConfig({ NEXT_PUBLIC_ANALYTICS_PROVIDER: "other" }).provider).toBe("none");
  });
});

describe("isSensitivePath", () => {
  it("flags private pages and pages whose URL carries a token", () => {
    expect(isSensitivePath("/admin")).toBe(true);
    expect(isSensitivePath("/admin/users")).toBe(true);
    expect(isSensitivePath("/reset-password")).toBe(true);
    expect(isSensitivePath("/verify-email")).toBe(true);
    expect(isSensitivePath("/auth/callback")).toBe(true);
  });

  it("leaves public pages alone", () => {
    expect(isSensitivePath("/")).toBe(false);
    expect(isSensitivePath("/listings/some-garage")).toBe(false);
  });
});

describe("trackEvent", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.gtag = vi.fn();
  });

  afterEach(() => {
    delete window.gtag;
    Object.defineProperty(window.navigator, "doNotTrack", { value: null, configurable: true });
  });

  it("sends nothing before the visitor has accepted", () => {
    trackEvent("view_listing", { listing_id: "1" }, GA);
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("sends nothing after the visitor declined", () => {
    window.localStorage.setItem("cookie-consent", "declined");
    trackEvent("view_listing", { listing_id: "1" }, GA);
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("sends the event once the visitor accepted", () => {
    window.localStorage.setItem("cookie-consent", "accepted");
    trackEvent("view_listing", { listing_id: "1" }, GA);
    expect(window.gtag).toHaveBeenCalledWith("event", "view_listing", { listing_id: "1" });
  });

  it("respects the browser's Do Not Track setting", () => {
    window.localStorage.setItem("cookie-consent", "accepted");
    Object.defineProperty(window.navigator, "doNotTrack", { value: "1", configurable: true });
    trackEvent("view_listing", { listing_id: "1" }, GA);
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("does nothing when no provider is configured", () => {
    window.localStorage.setItem("cookie-consent", "accepted");
    trackEvent("view_listing", {}, getAnalyticsConfig({}));
    expect(window.gtag).not.toHaveBeenCalled();
  });
});
