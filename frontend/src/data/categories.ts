import { Category } from "@/types";
import {
  Wrench,
  Truck,
  Bike,
  PackageSearch,
  Sparkles,
  Car,
  PaintBucket,
  Droplets,
  Zap,
} from "lucide-react";

export const categories: Category[] = [
  {
    id: "auto",
    label: "Auto",
    subCategories: [
      { id: "auto-garage", label: "Auto Garage", icon: Wrench },
      { id: "heavy-vehicle-garage", label: "Heavy Vehicle Garage", icon: Truck },
      { id: "bike-garage", label: "Bike Garage", icon: Bike },
      { id: "auto-parts", label: "Auto Parts", icon: PackageSearch },
      { id: "auto-recondition", label: "Auto Recondition", icon: Sparkles },
      { id: "auto-rental", label: "Auto Rental", icon: Car },
      { id: "denting-painting", label: "Denting & Painting", icon: PaintBucket },
      { id: "washing-center", label: "Washing Center", icon: Droplets },
      { id: "electric-vehicle-garage", label: "Electric Vehicle Garage", icon: Zap },
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