// categoryIcons.ts — the fixed set of icons an admin can attach to a category.
//
// A backend response can only ever send a string (e.g. "Wrench"), never a
// React component, so this is the one place that turns that string back into
// the real icon. Keep this list curated rather than open — every id here
// must be a real named export of lucide-react, and the admin's icon picker
// should only ever offer names from this list (never free text), or a typo
// silently renders no icon at all instead of failing loudly.
import {
  Bike,
  Car,
  Coffee,
  CookingPot,
  Dessert,
  Droplets,
  LucideIcon,
  PackageSearch,
  PaintBucket,
  Pizza,
  Soup,
  Sparkles,
  Truck,
  UtensilsCrossed,
  Wrench,
  Zap,
  // Generic extras, so a brand-new category isn't stuck reusing an
  // unrelated icon just because nothing on-topic exists yet.
  Store,
  Tag,
  MapPin,
  Home,
  ShoppingBag,
  Briefcase,
  Star,
  Settings,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Wrench,
  Truck,
  Bike,
  PackageSearch,
  Sparkles,
  Car,
  PaintBucket,
  Droplets,
  Zap,
  Coffee,
  CookingPot,
  Dessert,
  Pizza,
  Soup,
  UtensilsCrossed,
  Store,
  Tag,
  MapPin,
  Home,
  ShoppingBag,
  Briefcase,
  Star,
  Settings,
};

export type CategoryIconKey = keyof typeof CATEGORY_ICONS;

export const CATEGORY_ICON_KEYS = Object.keys(
  CATEGORY_ICONS
) as CategoryIconKey[];

// Unknown or missing key -> undefined, same as "no icon" today (SubCategory.icon
// is already optional, so callers already handle this).
export function resolveCategoryIcon(key?: string | null): LucideIcon | undefined {
  if (!key) return undefined;
  return CATEGORY_ICONS[key];
}