// HoursAmenitiesStep.tsx — Step 4 of the /register wizard: opening hours
// per day, amenities, parking, and accepted payment methods. Amenities and
// payment methods are sourced from AutoHub Nepal's real garage listing
// pages (see src/data/amenities.ts for the source note) rather than
// invented, to match what customers actually expect to see on a garage
// listing in this market. No fields are required here — a business can
// always come back and fill these in later.
"use client";

import {
  Wifi,
  Bath,
  Armchair,
  Users,
  ParkingCircle,
  Banknote,
  Smartphone,
  QrCode,
  CreditCard,
  Building2,
  Check,
  X,
} from "lucide-react";
import { theme } from "@/config/theme";
import { amenityCatalog, paymentMethodCatalog } from "@/data/amenities";
import { RegisterFormData } from "@/components/sections/RegisterPage";

interface HoursAmenitiesStepProps {
  values: RegisterFormData;
  onChange: (patch: Partial<RegisterFormData>) => void;
  navButtons: React.ReactNode;
}

// Amenity/payment icon keys -> lucide components. Kept as a lookup (rather
// than storing components directly on the catalog) for the same reason
// Amenity.icon on the Business type is a string key: these catalog objects
// are plain data, safe to reuse anywhere, not JSX.
const amenityIcons: Record<string, typeof Wifi> = {
  wifi: Wifi,
  restroom: Bath,
  seating: Armchair,
  family: Users,
};

const paymentIcons: Record<string, typeof Wifi> = {
  cash: Banknote,
  esewa: Smartphone,
  qr: QrCode,
  card: CreditCard,
  bank: Building2,
};

export function HoursAmenitiesStep({
  values,
  onChange,
  navButtons,
}: HoursAmenitiesStepProps) {
  function updateDay(
    day: string,
    patch: Partial<{ open: string; close: string; closed: boolean }>,
  ) {
    onChange({
      openingHours: values.openingHours.map((d) =>
        d.day === day ? { ...d, ...patch } : d,
      ),
    });
  }

  function toggleAmenity(label: string) {
    const selected = values.amenities.includes(label)
      ? values.amenities.filter((a) => a !== label)
      : [...values.amenities, label];
    onChange({ amenities: selected });
  }

  function togglePayment(label: string) {
    const selected = values.paymentMethods.includes(label)
      ? values.paymentMethods.filter((p) => p !== label)
      : [...values.paymentMethods, label];
    onChange({ paymentMethods: selected });
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">
        Timing, amenities, and how customers can pay you.
      </p>

      <div className="space-y-8 max-w-3xl">
        {/* Opening Hours */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Opening Hours
          </h3>
          <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {values.openingHours.map((d) => (
              <div
                key={d.day}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <span className="w-24 shrink-0 text-sm font-medium text-gray-800">
                  {d.day}
                </span>

                {d.closed ? (
                  <span className="flex-1 text-sm text-gray-400 italic">
                    Closed
                  </span>
                ) : (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="time"
                      value={d.open}
                      onChange={(e) =>
                        updateDay(d.day, { open: e.target.value })
                      }
                      style={{
                        ["--focus-border" as string]: theme.colors.primary,
                      }}
                      className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700 outline-none transition-colors duration-150 focus:border-[var(--focus-border)]"
                    />
                    <span className="text-sm text-gray-400">-</span>
                    <input
                      type="time"
                      value={d.close}
                      onChange={(e) =>
                        updateDay(d.day, { close: e.target.value })
                      }
                      style={{
                        ["--focus-border" as string]: theme.colors.primary,
                      }}
                      className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700 outline-none transition-colors duration-150 focus:border-[var(--focus-border)]"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => updateDay(d.day, { closed: !d.closed })}
                  style={{
                    ["--accent" as string]: theme.colors.primary,
                  }}
                  className={`ml-auto shrink-0 text-xs font-semibold transition-colors duration-150 ${
                    d.closed
                      ? "text-[var(--accent)]"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {d.closed ? "Mark as Open" : "Mark as Closed"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Amenities
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {amenityCatalog.map((amenity) => {
              const Icon = amenityIcons[amenity.icon] ?? Wifi;
              const checked = values.amenities.includes(amenity.label);
              return (
                <label
                  key={amenity.label}
                  style={{
                    ["--accent-tint" as string]: `${theme.colors.primary}0D`,
                    ["--accent-border" as string]: `${theme.colors.primary}55`,
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm cursor-pointer transition-colors duration-150 ${
                    checked
                      ? "bg-[var(--accent-tint)] border-[var(--accent-border)] text-gray-900"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAmenity(amenity.label)}
                    style={{ accentColor: theme.colors.primary }}
                    className="h-4 w-4 shrink-0"
                  />
                  <Icon size={15} className="shrink-0" />
                  {amenity.label}
                </label>
              );
            })}
          </div>
        </div>

        {/* Parking */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Parking</h3>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => onChange({ parkingAvailable: true })}
              style={{
                ["--accent-tint" as string]: `${theme.colors.primary}0D`,
                ["--accent-border" as string]: `${theme.colors.primary}55`,
              }}
              className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors duration-150 ${
                values.parkingAvailable === true
                  ? "bg-[var(--accent-tint)] border-[var(--accent-border)] text-gray-900"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Check size={15} />
              Yes
            </button>
            <button
              type="button"
              onClick={() => onChange({ parkingAvailable: false })}
              style={{
                ["--accent-tint" as string]: `${theme.colors.primary}0D`,
                ["--accent-border" as string]: `${theme.colors.primary}55`,
              }}
              className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors duration-150 ${
                values.parkingAvailable === false
                  ? "bg-[var(--accent-tint)] border-[var(--accent-border)] text-gray-900"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <X size={15} />
              No
            </button>
          </div>
          {values.parkingAvailable === null && (
            <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
              <ParkingCircle size={13} />
              Let customers know if they can park on-site.
            </p>
          )}
        </div>

        {/* Payment */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment</h3>
          <div className="flex flex-wrap gap-2.5">
            {paymentMethodCatalog.map((method) => {
              const Icon = paymentIcons[method.icon] ?? Banknote;
              const checked = values.paymentMethods.includes(method.label);
              return (
                <button
                  key={method.label}
                  type="button"
                  onClick={() => togglePayment(method.label)}
                  style={{
                    ["--accent-tint" as string]: `${theme.colors.primary}0D`,
                    ["--accent-border" as string]: `${theme.colors.primary}55`,
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    checked
                      ? "bg-[var(--accent-tint)] border-[var(--accent-border)] text-gray-900"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={15} />
                  {method.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {navButtons}
    </div>
  );
}
