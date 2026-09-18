"use client";

import { useFormContext } from "react-hook-form";
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
import type { RegisterFormData } from "@/components/sections/RegisterPage";

interface HoursAmenitiesStepProps {
  values: RegisterFormData;
  onChange: (patch: Partial<RegisterFormData>) => void;
  navButtons: React.ReactNode;
}

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

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }

  return undefined;
}

export function HoursAmenitiesStep({
  values,
  onChange,
  navButtons,
}: HoursAmenitiesStepProps) {
  const {
    formState: { errors },
  } = useFormContext<RegisterFormData>();

  function updateDay(
    day: string,
    patch: Partial<{ open: string; close: string; closed: boolean }>,
  ) {
    onChange({
      openingHours: values.openingHours.map((item) =>
        item.day === day ? { ...item, ...patch } : item,
      ),
    });
  }

  function toggleAmenity(label: string) {
    const selected = values.amenities.includes(label)
      ? values.amenities.filter((amenity) => amenity !== label)
      : [...values.amenities, label];

    onChange({ amenities: selected });
  }

  function togglePayment(label: string) {
    const selected = values.paymentMethods.includes(label)
      ? values.paymentMethods.filter((method) => method !== label)
      : [...values.paymentMethods, label];

    onChange({ paymentMethods: selected });
  }

  return (
    <div>
      <p className="mb-5 text-sm text-gray-500">
        Timing, amenities, and how customers can pay you.
      </p>

      <div className="max-w-3xl space-y-8">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
            Opening Hours
          </h3>

          <div className="overflow-hidden rounded-xl border border-gray-200 divide-y divide-gray-100">
            {values.openingHours.map((day, index) => {
              const timeError = getErrorMessage(
                errors.openingHours?.[index]?.close,
              );

              return (
                <div
                  key={day.day}
                  className={`px-4 py-3 ${timeError ? "bg-red-50/60" : ""}`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="w-24 shrink-0 text-sm font-medium text-gray-800">
                      {day.day}
                    </span>

                    {day.closed ? (
                      <span className="flex-1 text-sm italic text-gray-400">
                        Closed
                      </span>
                    ) : (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="time"
                          value={day.open}
                          onChange={(event) =>
                            updateDay(day.day, {
                              open: event.target.value,
                            })
                          }
                          style={{
                            ["--focus-border" as string]: theme.colors.primary,
                          }}
                          className={`rounded-lg border px-2.5 py-1.5 text-sm text-gray-700 outline-none transition-colors duration-150 focus:border-[var(--focus-border)] ${
                            timeError ? "border-red-400" : "border-gray-300"
                          }`}
                        />

                        <span className="text-sm text-gray-400">–</span>

                        <input
                          type="time"
                          value={day.close}
                          onChange={(event) =>
                            updateDay(day.day, {
                              close: event.target.value,
                            })
                          }
                          aria-invalid={Boolean(timeError)}
                          style={{
                            ["--focus-border" as string]: theme.colors.primary,
                          }}
                          className={`rounded-lg border px-2.5 py-1.5 text-sm text-gray-700 outline-none transition-colors duration-150 focus:border-[var(--focus-border)] ${
                            timeError ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        updateDay(day.day, { closed: !day.closed })
                      }
                      style={{
                        ["--accent" as string]: theme.colors.primary,
                      }}
                      className={`ml-auto shrink-0 text-xs font-semibold transition-colors duration-150 ${
                        day.closed
                          ? "text-[var(--accent)]"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {day.closed ? "Mark as Open" : "Mark as Closed"}
                    </button>
                  </div>

                  {timeError && (
                    <p
                      role="alert"
                      className="ml-0 mt-2 text-sm text-red-600 sm:ml-27"
                    >
                      {timeError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">
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
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors duration-150 ${
                    checked
                      ? "border-[var(--accent-border)] bg-[var(--accent-tint)] text-gray-900"
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

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Parking</h3>

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
                  ? "border-[var(--accent-border)] bg-[var(--accent-tint)] text-gray-900"
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
                  ? "border-[var(--accent-border)] bg-[var(--accent-tint)] text-gray-900"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <X size={15} />
              No
            </button>
          </div>

          {values.parkingAvailable === null && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
              <ParkingCircle size={13} />
              Let customers know if they can park on-site.
            </p>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Payment</h3>

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
                      ? "border-[var(--accent-border)] bg-[var(--accent-tint)] text-gray-900"
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
