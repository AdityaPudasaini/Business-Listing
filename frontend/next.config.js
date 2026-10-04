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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
  remotePatterns,
  minimumCacheTTL: 2592000,
  
  dangerouslyAllowLocalIP: process.env.NEXT_IMAGE_ALLOW_LOCAL_IP === "true",
},
};
module.exports = nextConfig;