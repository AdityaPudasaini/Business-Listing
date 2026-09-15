import { Amenity } from "@/types";

interface PaymentMethodOption {
  label: string;
  icon: string;
}

export const amenityCatalog: Amenity[] = [
  { label: "Vegetarian options", icon: "seating" },
  { label: "Outdoor seating", icon: "seating" },
  { label: "Family friendly", icon: "family" },
  { label: "Free WiFi", icon: "wifi" },
];

export const paymentMethodCatalog: PaymentMethodOption[] = [
  { label: "Cash", icon: "cash" },
  { label: "eSewa", icon: "esewa" },
  { label: "QR Scan", icon: "qr" },
  { label: "Credit/Debit Card", icon: "card" },
];
