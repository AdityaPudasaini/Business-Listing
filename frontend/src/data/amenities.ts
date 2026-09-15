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
import { amenityCatalog as autoAmenities, paymentMethodCatalog as autoPayments } from "@/data/autoAmenities";
import { amenityCatalog as restaurantAmenities, paymentMethodCatalog as restaurantPayments } from "@/data/restaurantAmenities";

export const amenityCatalog: Amenity[] = process.env.NEXT_PUBLIC_VERTICAL === "restaurant"
  ? restaurantAmenities
  : autoAmenities;

export interface PaymentMethodOption {
  label: string;
  icon: string; // key into the icon lookup map in HoursAmenitiesStep.tsx
}

export const paymentMethodCatalog: PaymentMethodOption[] = process.env.NEXT_PUBLIC_VERTICAL === "restaurant"
  ? restaurantPayments
  : autoPayments;

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
