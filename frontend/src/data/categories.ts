// One frontend, two datasets. Change NEXT_PUBLIC_VERTICAL to switch both data and labels.
import { categories as autoCategories } from "@/data/autoCategories";
import { categories as restaurantCategories } from "@/data/restaurantCategories";

const isRestaurant = process.env.NEXT_PUBLIC_VERTICAL === "restaurant";
export const categories = isRestaurant ? restaurantCategories : autoCategories;

export function getCategoryLabel(id: string): string {
  for (const category of categories) {
    if (category.id === id) return category.label;
    const subCategory = category.subCategories?.find((item) => item.id === id);
    if (subCategory) return subCategory.label;
  }
  return id;
}

export function businessMatchesCategory(businessCategory: string, selectedCategory: string): boolean {
  if (businessCategory === selectedCategory) return true;
  const parent = categories.find((category) => category.id === selectedCategory);
  return parent?.subCategories?.some((item) => item.id === businessCategory) ?? false;
}
