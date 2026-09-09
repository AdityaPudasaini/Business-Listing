// index.ts — shared TypeScript types used across the app. Add project-specific types here (or in a new file in this same folder) as you build features.
import { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
}

export interface SubCategory {
  id: string;
  label: string;
  // Optional — only needed by sections that render a visual showcase
  // (e.g. CategoryShowcase.tsx), not by the plain dropdown filter.
  icon?: LucideIcon;
}

export interface Category {
  id: string;
  label: string;
  disabled?: boolean;
  subCategories?: SubCategory[];
}

export interface Product {
  id: string;
  name: string;
  subtitle: string; // e.g. "5W30 API SN"
  badge: string; // e.g. "5W-30" or "Turbo Plus"
  description: string;
  viscosity: string;
  application: string;
  image: string;
}

export interface ServiceCategory {
  label: string;
  items?: string[]; // shown when the category is expanded
}

export interface Amenity {
  label: string;
  icon: string; // key into the icon lookup map in BusinessDetailPage.tsx —
  // NOT a live component reference, since Business objects cross the
  // server->client boundary (fetched in app/listings/[id]/page.tsx, a
  // Server Component, then passed as a prop into the Client Component
  // BusinessDetailPage). Functions can't be serialized across that
  // boundary — see the "cannot be passed to Client Components" error this
  // fixes.
}

export interface DayHours {
  day: string;
  hours: string;
}

export interface Business {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  description?: string;
  rating: number;
  reviewCount?: number;
  reviews?: Review[]; // TODO: not in the Prisma schema yet — dummy placeholder for now
  phone?: string;
  whatsapp?: string;
  email?: string; // TODO: not in the Prisma schema yet — dummy placeholder for now
  hours?: string; // TODO: not in the Prisma schema yet — dummy placeholder for now
  hoursByDay?: DayHours[]; // TODO: not in the Prisma schema yet — dummy placeholder for now
  gallery?: string[]; // TODO: not in the Prisma schema yet — dummy placeholder for now
  services?: ServiceCategory[]; // TODO: not in the Prisma schema yet — dummy placeholder for now
  amenities?: Amenity[]; // TODO: not in the Prisma schema yet — dummy placeholder for now
  paymentMethods?: string[]; // TODO: not in the Prisma schema yet — dummy placeholder for now
  isPartner?: boolean;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
}

export interface Review {
  id: string;
  businessId: string;
  rating: number; // 1–5
  title: string;
  message: string;
  authorName: string;
  createdAt: string; // ISO date string
}