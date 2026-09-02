import { Category } from "@/types";

export const categories: Category[] = [
  {
    id: "auto",
    label: "Auto",
    subCategories: [
      { id: "auto-garage", label: "Auto Garage" },
      { id: "heavy-vehicle-garage", label: "Heavy Vehicle Garage" },
      { id: "bike-garage", label: "Bike Garage" },
      { id: "auto-parts", label: "Auto Parts" },
      { id: "auto-recondition", label: "Auto Recondition" },
      { id: "auto-rental", label: "Auto Rental" },
      { id: "denting-painting", label: "Denting & Painting" },
      { id: "washing-center", label: "Washing Center" },
      { id: "electric-vehicle-garage", label: "Electric Vehicle Garage" },
    ],
  },
  {
    id: "restaurant",
    label: "Restaurant",
    disabled: true,
  },
];


export function getCategoryLabel(id: string): string {
  for (const cat of categories) {
    if (cat.id === id) return cat.label;
    const sub = cat.subCategories?.find((s) => s.id === id);
    if (sub) return sub.label;
  }
  return id;
}

export function businessMatchesCategory(
  businessCategory: string,
  selectedCategory: string
): boolean {
  if (businessCategory === selectedCategory) return true;
  const parent = categories.find((c) => c.id === selectedCategory);
  return parent?.subCategories?.some((s) => s.id === businessCategory) ?? false;
}