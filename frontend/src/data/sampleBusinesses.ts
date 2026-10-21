import { sampleBusinesses as autoBusinesses } from "@/data/autoBusinesses";
import { sampleBusinesses as restaurantBusinesses } from "@/data/restaurantBusinesses";
import { withUniqueSlugs } from "@/lib/slugify";

// Components always import this one file; only the vertical setting changes.
export const sampleBusinesses = withUniqueSlugs(
  process.env.NEXT_PUBLIC_VERTICAL === "restaurant"
    ? restaurantBusinesses
    : autoBusinesses,
);