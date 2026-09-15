import { Amenity } from "@/types";

interface PaymentMethodOption {
  label: string;
  icon: string;
}

export const amenityCatalog: Amenity[] = [
  { label: "Free WiFi", icon: "wifi" },
  { label: "Restroom Available", icon: "restroom" },
  { label: "Outdoor Seating", icon: "seating" },
  { label: "Family Friendly", icon: "family" },
];

export const paymentMethodCatalog: PaymentMethodOption[] = [
  { label: "Cash", icon: "cash" },
  { label: "eSewa", icon: "esewa" },
  { label: "QR Scan", icon: "qr" },
  { label: "Credit/Debit Card", icon: "card" },
  { label: "Bank Transfer", icon: "bank" },
];
