/** next.config.js — Next.js build/runtime configuration. Leave as-is unless you need image domains or redirects. */
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};
module.exports = nextConfig;