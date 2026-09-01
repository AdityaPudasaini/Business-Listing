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
}