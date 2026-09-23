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

export interface Advertisement {
  id: string;
  title: string;
  subtitle: string; // e.g. "Valid through Dashain"
  description: string;
  badge: string; // e.g. "20% OFF" or "Limited Time"
  image: string;
}
export interface ServiceCategory {
  label: string;
  items?: string[]; // shown when the category is expanded
}

export interface Amenity {
  label: string;
  icon: string;
}

export interface DayHours {
  day: string;
  hours: string;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  image: string;
  bannerImage?: string;
  category: string;
  location: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  reviews?: Review[];
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  hours?: string;
  hoursByDay?: DayHours[];
  gallery?: string[];
  services?: ServiceCategory[];
  amenities?: Amenity[];
  paymentMethods?: string[];
  isPartner?: boolean;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
}

export interface Review {
  id: string;
  businessId: string;
  userId?: string; // present when backend-configured; lets the UI show a delete action only on the current user's own review
  rating: number; // 1–5
  title: string;
  message: string;
  authorName: string;
  createdAt: string; // ISO date string
}

// Keep backend-specific field names in the API layer or a mapper. Components
// work with these shared shapes regardless of whether the data comes from the
// Auto or Restaurant platform.
export interface ListingSearchParams {
  query?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sort?: "alphabetical" | "distance";
  page?: number;
  limit?: number;
}

export interface CreateReviewInput {
  rating: number;
  title: string;
  message: string;
  firstName: string;
  lastName: string;
}

export interface CreateBookingInput {
  businessId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  service: string;
  date: string;
  timeWindow: string;
  // Auto uses this for vehicle information. A restaurant can later use
  // partySize or notes without changing the shared listing model.
  details?: Record<string, string | number | boolean>;
}

// Images are uploaded separately. The listing endpoint receives their final
// public URLs, never browser File objects or object URLs.
export interface CreateListingInput {
  name: string;
  description?: string;
  category: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  services: string[];
  openingHours: DayHours[];
  amenities: string[];
  parkingAvailable?: boolean;
  paymentMethods: string[];
   image?: string | null;
  coverImage?: string | null;
  gallery?: string[];
}

export interface OwnerListing {
  id: string;
  slug: string;
  name: string;
  category: string;
  location: string;
  services: string[];
  phone: string;
  description?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  latitude?: number;
  longitude?: number;
  openingHours?: DayHours[];
  amenities?: string[];
  paymentMethods?: string[];
  parkingAvailable?: boolean | null;
  image?: string;
  coverImage?: string;
  gallery?: string[];
  submittedAt: string; // ISO date string
  // `published` remains for the offline demo dataset; the live API uses
  // `approved`, `pending`, and `rejected`.
  status: "approved" | "pending" | "rejected" | "published";
}
export interface OwnerAccount {
  ownerName: string;
  username: string;
  email: string;
  phone: string;
}


// Maps to the Prisma `Product` model — GET/POST/PATCH/DELETE
// /businesses/:businessId/products on the backend.
export interface BusinessProduct {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  price?: number;
  image?: string;
  category?: string;
  isAvailable: boolean;
}

export interface BusinessProductInput {
  name: string;
  description?: string;
  price?: number;
  image?: string;
  category?: string;
  isAvailable?: boolean;
}

// One row from GET /hero-images — a homepage background slide, managed by
// admins from /admin/hero-images.
export interface HeroImage {
  id: string;
  url: string;
  order: number;
}

// One row from GET /bookings — a booking the current logged-in user made.
export interface MyBooking {
  id: string;
  date: string; // ISO date string
  time: string; // "HH:mm"
  service?: string;
  details?: Record<string, string | number | boolean>;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: "pending" | "confirmed" | "declined" | "cancelled" | string;
  business: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface AdminCategory {
  id: string;
  label: string;
  icon?: string;
  order: number;
  parentId?: string | null;
}

export interface CreateCategoryInput {
  label: string;
  icon?: string;
  order?: number;
  parentId?: string;
}

export interface UpdateCategoryInput {
  label?: string;
  icon?: string;
  order?: number;
}

export interface CustomerChatMessage {
  id: string;
  sender: "user" | "bot";
  content: string;
  createdAt: string;
}

// One line in the owner <-> customer message thread. Distinct from
// CustomerChatMessage: this is a real conversation, not chatbot history.
export interface OwnerMessageEntry {
  id: string;
  sender: "owner" | "customer";
  content: string;
  createdAt: string;
  read?: boolean;
}

export interface CustomerBookingSummary {
  id: string;
  date: string; // ISO date string
  time: string;
  service?: string;
  status: "pending" | "confirmed" | "declined" | "cancelled" | string;
}

export interface CustomerReviewSummary {
  id: string;
  rating: number;
  title?: string;
  message: string;
  createdAt: string;
}

// One customer's full activity against one business — bookings, review,
// chatbot history and the message thread all in one place. This is the
// shape both the owner dashboard's Customers tab and the admin per-business
// page render.
export interface BusinessCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  businessId: string;
  businessName: string;
  bookings: CustomerBookingSummary[];
  review?: CustomerReviewSummary;
  chatLog: CustomerChatMessage[];
  messages: OwnerMessageEntry[];
}