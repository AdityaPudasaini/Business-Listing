// analytics.ts -- optional, privacy-respecting analytics (Google Analytics 4 or Plausible).
// Nothing loads and nothing is sent unless ALL of these are true:
//   1. a provider is configured through NEXT_PUBLIC_ANALYTICS_PROVIDER,
//   2. the visitor clicked "Accept" on the cookie banner (lib/cookieConsent.ts),
//   3. the browser's "Do Not Track" setting is off,
//   4. the current page is not a private one (admin, or a page whose URL carries a secret token).
// Events never include names, emails or message text -- only ids and categories.
import { hasOptionalConsent } from "@/lib/cookieConsent";

export type AnalyticsProvider = "ga4" | "plausible" | "none";

export interface AnalyticsConfig {
  provider: AnalyticsProvider;
  gaMeasurementId: string;
  plausibleDomain: string;
  plausibleSrc: string;
}

// Each variable is written out in full so Next.js can inline it into the browser bundle
// (it cannot do that for dynamic lookups such as process.env[name]).
const publicEnv = {
  NEXT_PUBLIC_ANALYTICS_PROVIDER: process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
  NEXT_PUBLIC_PLAUSIBLE_SRC: process.env.NEXT_PUBLIC_PLAUSIBLE_SRC,
};
type Env = Partial<Record<keyof typeof publicEnv, string | undefined>>;

const DEFAULT_PLAUSIBLE_SRC = "https://plausible.io/js/script.js";
// Strict formats: these values end up inside script URLs, so anything unexpected means "off".
const GA_ID_PATTERN = /^G-[A-Z0-9]{4,20}$/;
const DOMAIN_PATTERN = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

const OFF: AnalyticsConfig = {
  provider: "none",
  gaMeasurementId: "",
  plausibleDomain: "",
  plausibleSrc: "",
};

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function getAnalyticsConfig(env: Env = publicEnv): AnalyticsConfig {
  const provider = (env.NEXT_PUBLIC_ANALYTICS_PROVIDER ?? "").trim().toLowerCase();
  const gaId = (env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "").trim();
  const domain = (env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "").trim();
  const src = (env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "").trim() || DEFAULT_PLAUSIBLE_SRC;

  if (provider === "ga4" && GA_ID_PATTERN.test(gaId)) {
    return { ...OFF, provider: "ga4", gaMeasurementId: gaId };
  }
  if (provider === "plausible" && DOMAIN_PATTERN.test(domain) && isHttpsUrl(src)) {
    return { ...OFF, provider: "plausible", plausibleDomain: domain, plausibleSrc: src };
  }
  return OFF;
}

// Pages that are private, or whose address carries a secret (reset / verification tokens).
const SENSITIVE_PREFIXES = ["/admin", "/auth/", "/reset-password", "/verify-email"];

export function isSensitivePath(pathname: string) {
  return SENSITIVE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    plausible?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  }
}

/** Visitor said yes and has not asked their browser to opt out of tracking. */
export function consentGiven(): boolean {
  if (typeof window === "undefined") return false;
  if (!hasOptionalConsent()) return false;
  const doNotTrack =
    window.navigator.doNotTrack ?? (window as unknown as { doNotTrack?: string }).doNotTrack;
  return doNotTrack !== "1";
}

export function trackingAllowed(config: AnalyticsConfig = getAnalyticsConfig()): boolean {
  if (config.provider === "none") return false;
  if (!consentGiven()) return false;
  return !isSensitivePath(window.location.pathname);
}

function appendScript(src: string, attributes: Record<string, string> = {}) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  for (const [name, value] of Object.entries(attributes)) script.setAttribute(name, value);
  document.head.appendChild(script);
}

let loadedKey: string | null = null;

/** Loads the provider's script (once). Only call this after consent has been given. */
export function loadAnalytics(config: AnalyticsConfig = getAnalyticsConfig()) {
  if (typeof document === "undefined" || config.provider === "none") return;
  const key = `${config.provider}:${config.gaMeasurementId || config.plausibleDomain}`;
  if (loadedKey === key) return;
  loadedKey = key;

  if (config.provider === "ga4") {
    const id = config.gaMeasurementId;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // GA's queue needs the real `arguments` object, not an array.
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    // send_page_view is off: page views are sent by hand (see trackPageView) so the address
    // can be stripped of its query string first.
    window.gtag("config", id, {
      send_page_view: false,
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    appendScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
    return;
  }

  window.plausible =
    window.plausible ||
    Object.assign(
      (...args: unknown[]) => {
        (window.plausible!.q = window.plausible!.q || []).push(args);
      },
      {},
    );
  appendScript(config.plausibleSrc, {
    defer: "",
    "data-domain": config.plausibleDomain,
    "data-exclude": "/admin*,/auth/*,/reset-password*,/verify-email*",
  });
}

/** Google's documented opt-out switch; stops GA even if its script is already on the page. */
export function setAnalyticsOptOut(config: AnalyticsConfig, optedOut: boolean) {
  if (typeof window === "undefined" || config.provider !== "ga4") return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${config.gaMeasurementId}`] = optedOut;
}

export type EventParams = Record<string, string | number | boolean>;

export function trackEvent(
  name: string,
  params: EventParams = {},
  config: AnalyticsConfig = getAnalyticsConfig(),
) {
  if (!trackingAllowed(config)) return;
  if (config.provider === "ga4") {
    window.gtag?.("event", name, params);
  } else if (config.provider === "plausible") {
    window.plausible?.(name, { props: params });
  }
}

/** GA4 only -- Plausible follows route changes by itself. `path` must not include a query string. */
export function trackPageView(path: string, config: AnalyticsConfig = getAnalyticsConfig()) {
  if (config.provider !== "ga4" || !trackingAllowed(config)) return;
  window.gtag?.("event", "page_view", {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: document.title,
  });
}
