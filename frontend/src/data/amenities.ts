// amenities.ts — catalog for the /register wizard's "Hours & Amenities" step
// (HoursAmenitiesStep.tsx). The amenity list is sourced from AutoHub Nepal's
// real garage listing pages (autohubnepal.com/AutoCare/*) — every listing
// there shows the same four amenity badges (Free WiFi, Restroom Available,
// Outdoor Seating, Family Friendly), so that's the reference set used here
// instead of guessing. Payment methods are likewise sourced from the
// "Payment Methods" block on those same listing pages (Cash, eSewa, QR
// Scan, Bank Transfer, Credit Card show up across different garages).
// Uses the same Amenity shape already defined on Business.amenities in
// types/index.ts.
import { Amenity } from "@/types";

export const amenityCatalog: Amenity[] = [
  { label: "Free WiFi", icon: "wifi" },
  { label: "Restroom Available", icon: "restroom" },
  { label: "Outdoor Seating", icon: "seating" },
  { label: "Family Friendly", icon: "family" },
];

export interface PaymentMethodOption {
  label: string;
  icon: string; // key into the icon lookup map in HoursAmenitiesStep.tsx
}

export const paymentMethodCatalog: PaymentMethodOption[] = [
  { label: "Cash", icon: "cash" },
  { label: "eSewa", icon: "esewa" },
  { label: "QR Scan", icon: "qr" },
  { label: "Credit/Debit Card", icon: "card" },
  { label: "Bank Transfer", icon: "bank" },
];

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;