// site.ts — the one place that knows the site's public URL. Used to build
// canonical links, Open Graph URLs, robots.txt and sitemap.xml.

function withoutTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

// A production build without the real URL would publish canonical links and
// a sitemap pointing at localhost, so fail the build instead of shipping that.
if (!configuredSiteUrl && process.env.NODE_ENV === "production") {
  throw new Error(
    "NEXT_PUBLIC_SITE_URL is not set. Set it to the site's public URL (e.g. https://www.your-domain.com) before building for production.",
  );
}

export const siteUrl = withoutTrailingSlash(
  configuredSiteUrl || "http://localhost:3000"
);

export function absoluteUrl(path: string) {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

// Used in landing-page titles and copy ("Auto Garage in Nepal"). Override per
// deployment with NEXT_PUBLIC_COUNTRY_NAME.
export const countryName =
  process.env.NEXT_PUBLIC_COUNTRY_NAME?.trim() || "Nepal";