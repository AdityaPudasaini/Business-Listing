// index.ts — shared TypeScript types used across the app. Add project-specific types here (or in a new file in this same folder) as you build features.
export interface NavItem {
  label: string;
  href: string;
}

export interface SubCategory {
  id: string;
  label: string;
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

export interface Business {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  description?: string;
  rating: number;
  reviewCount?: number;
  phone?: string;
  whatsapp?: string;
  isPartner?: boolean;
  latitude?: number; // matches the backend's Business.latitude
  longitude?: number; // matches the backend's Business.longitude
  distanceKm?: number; // computed client-side (or by the backend later) once the user's coords are known — not stored in the DB
}