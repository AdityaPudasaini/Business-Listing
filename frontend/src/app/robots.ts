import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

// Next serves this at /robots.txt automatically — nothing under public/ is
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/auth/callback"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}