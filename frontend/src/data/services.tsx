import { serviceCatalog as autoServices } from "@/data/autoServices";
import { serviceCatalog as restaurantServices } from "@/data/restaurantServices";

export const serviceCatalog = process.env.NEXT_PUBLIC_VERTICAL === "restaurant"
  ? restaurantServices
  : autoServices;
