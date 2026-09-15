import { heroImages as autoHeroImages } from "@/data/autoHeroImages";
import { heroImages as restaurantHeroImages } from "@/data/restaurantHeroImages";

export const heroImages = process.env.NEXT_PUBLIC_VERTICAL === "restaurant"
  ? restaurantHeroImages
  : autoHeroImages;
