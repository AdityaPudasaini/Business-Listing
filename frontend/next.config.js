/** next.config.js — Next.js build/runtime configuration. */

// Next's image optimizer only fetches remote images from hosts listed here;
// any other host fails to load. Hosts are derived from the env vars the app
// already uses, so a new deployment normally needs no edits to this file.
//
// Add any other image host (CDN, WordPress site, ...) with
//   NEXT_PUBLIC_IMAGE_HOSTS=cdn.example.com,images.other.com
function toPattern(value) {
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return {
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
    };
  } catch {
    return null;
  }
}

const hostSources = [
  process.env.NEXT_PUBLIC_API_URL, // uploaded images are served from <api>/files/...
  process.env.NEXT_PUBLIC_SITE_URL,
  "https://images.unsplash.com", // sample data + default hero images
  ...(process.env.NEXT_PUBLIC_IMAGE_HOSTS || "").split(","),
]
  .map((value) => value?.trim())
  .filter(Boolean);

const seen = new Set();
const remotePatterns = hostSources
  .map(toPattern)
  .filter(Boolean)
  .filter((pattern) => {
    const key = `${pattern.protocol}://${pattern.hostname}:${pattern.port ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

// ---------------------------------------------------------------------------------------
// Security headers and Content-Security-Policy.
//
// CSP_MODE:  "enforce"     block anything the policy does not allow
//            "report-only" only log violations in the browser console (nothing is blocked)
//            "off"         send no CSP
// Default: report-only for production builds, off in development. Roll out by deploying in
// report-only, browsing the site with the console open, then switching to "enforce".
// NOTE: Next.js computes these headers at BUILD time, so changing CSP_MODE needs a rebuild.
//
// script-src has to allow 'unsafe-inline': Next.js emits small inline scripts for page
// hydration (and layout.tsx has one for the splash screen). Everything else is tightened:
// no plugins, no framing, no base-tag tricks, and connections only to known origins.
// ---------------------------------------------------------------------------------------
const isProd = process.env.NODE_ENV === "production";
const cspMode = ["enforce", "report-only", "off"].includes(process.env.CSP_MODE)
  ? process.env.CSP_MODE
  : isProd
    ? "report-only"
    : "off";

function originOf(value) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function buildCsp() {
  const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_URL || "");
  const provider = (process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER || "").trim().toLowerCase();
  const plausibleOrigin = originOf(
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "https://plausible.io/js/script.js",
  );

  const script = ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://maps.gstatic.com"];
  const connect = ["'self'", "https://maps.googleapis.com"];
  const img = ["'self'", "data:", "blob:", "https:"];

  if (apiOrigin) {
    connect.push(apiOrigin);
    img.push(apiOrigin); // uploaded photos, also when the API is plain http in development
  }
  if (provider === "ga4") {
    script.push("https://www.googletagmanager.com");
    connect.push(
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
    );
  }
  if (provider === "plausible" && plausibleOrigin) {
    script.push(plausibleOrigin);
    connect.push(plausibleOrigin);
  }
  if (!isProd) {
    script.push("'unsafe-eval'"); // Next.js dev tooling
    connect.push("ws:", "wss:"); // hot reload
  }

  const directives = {
    "default-src": ["'self'"],
    "script-src": script,
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": img,
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    "connect-src": connect,
    "worker-src": ["'self'", "blob:"],
    "frame-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  const parts = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (isProd && cspMode === "enforce") parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

function securityHeaders() {
  const headers = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // "Locate me" needs geolocation on this site; everything else is switched off.
    { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
  ];
  if (isProd) {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
  }
  if (cspMode !== "off") {
    headers.push({
      key: cspMode === "enforce" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
      value: buildCsp(),
    });
  }
  return headers;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders() }];
  },
  images: {
  remotePatterns,
  minimumCacheTTL: 2592000,
  
  dangerouslyAllowLocalIP: process.env.NEXT_IMAGE_ALLOW_LOCAL_IP === "true",
},
};
module.exports = nextConfig;