// site.ts — the one place that knows the site's public URL. Used to build

function withoutTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

export const siteUrl = withoutTrailingSlash(
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"
);

export function absoluteUrl(path: string) {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}