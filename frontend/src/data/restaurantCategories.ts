import { Coffee, CookingPot, Dessert, Pizza, Soup, UtensilsCrossed } from "lucide-react";
import { Category } from "@/types";

export const categories: Category[] = [
  { id: "restaurant", label: "Restaurants", subCategories: [
    { id: "nepali", label: "Nepali Cuisine", icon: CookingPot },
    { id: "newari", label: "Newari Food", icon: UtensilsCrossed },
    { id: "cafe", label: "Cafés & Bakery", icon: Coffee },
    { id: "international", label: "International", icon: Pizza },
    { id: "momo", label: "Momo & Snacks", icon: Soup },
    { id: "dessert", label: "Desserts", icon: Dessert },
  ] },
];

export function businessMatchesCategory(businessCategory: string, selectedCategory: string) {
  if (selectedCategory === "restaurant") return true;
  return businessCategory === selectedCategory;
}
