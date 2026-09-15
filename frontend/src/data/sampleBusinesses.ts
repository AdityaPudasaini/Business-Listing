import { sampleBusinesses as autoBusinesses } from "@/data/autoBusinesses";
import { sampleBusinesses as restaurantBusinesses } from "@/data/restaurantBusinesses";

// Components always import this one file; only the vertical setting changes.
export const sampleBusinesses = process.env.NEXT_PUBLIC_VERTICAL === "restaurant"
  ? restaurantBusinesses
  : autoBusinesses;
