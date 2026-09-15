// BookingModal.tsx — the "Booking Your Service" popup on the listing detail
// page. Not wired to the backend's Booking model yet (see the Prisma
// schema's Booking.businessId/date/time/status) — onSubmit just shows a
// success state locally. Replace handleSubmit's TODO with a real
// apiPost("/bookings", {...}) once that endpoint exists.
"use client";

import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { theme } from "@/config/theme";
import { Business } from "@/types";
import { createBooking, isBackendConfigured } from "@/services/api";
import { getActiveVertical } from "@/features/verticals";

interface BookingModalProps {
  business: Business;
  onClose: () => void;
}

// Shared styling for the two dropdowns so they match the Input component's
// look (white bg, gray border, red focus ring) instead of the browser
// default <select> chrome.
function selectClassName() {
  return "w-full appearance-none rounded-xl border border-gray-300 bg-white px-5 py-3.5 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-400 focus:border-[var(--focus-border)] focus:ring-1 focus:ring-[var(--focus-ring)]";
}

export function BookingModal({ business, onClose }: BookingModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const vertical = getActiveVertical();

  const serviceOptions = business.services?.map((s) => s.label) ?? [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSubmitting(true);
    setSubmitError("");

    try {
      // Demo mode remains usable while the backend is unavailable. Once an
      // API URL is configured, the exact same form submits a real request.
      if (isBackendConfigured) {
        await createBooking({
          businessId: business.id,
          firstName: String(formData.get("firstName") ?? ""),
          lastName: String(formData.get("lastName") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          email: String(formData.get("email") ?? "") || undefined,
          service: String(formData.get("service") ?? ""),
          date: String(formData.get("date") ?? ""),
          timeWindow: String(formData.get("timeWindow") ?? ""),
          details: Object.fromEntries(
            vertical.booking.extraFields.map((field) => [
              field.name,
              String(formData.get(field.name) ?? ""),
            ]),
          ),
        });
      }
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "We could not send your booking. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-2xl my-8 rounded-2xl bg-white shadow-2xl p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="py-6 text-center">
            <h3 className="text-lg font-bold text-gray-900">
              {vertical.id === "restaurant" ? "Reservation requested" : "Booking requested"}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {business.name} will confirm your request soon.
            </p>
            <Button
              label="Done"
              className="mt-6 w-full justify-center"
              onClick={onClose}
            />
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Wonderful Choice
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-gray-900">
                {vertical.labels.bookingTitle}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Fill in your details and {business.name} will confirm your slot
                shortly.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                ["--focus-border" as string]: theme.colors.primary,
                ["--focus-ring" as string]: theme.colors.primary,
              }}
              className="mt-7 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    First Name
                  </label>
                  <Input name="firstName" placeholder="First Name" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Last Name
                  </label>
                  <Input name="lastName" placeholder="Last Name" required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Email
                  </label>
                  <Input type="email" name="email" placeholder="Email" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                  {vertical.labels.bookingSelection}
                </label>
                <div className="relative">
                  <select
                    name="service"
                    defaultValue=""
                    required
                    className={selectClassName()}
                  >
                    <option value="" disabled>
                      Select {vertical.labels.bookingSelection.toLowerCase()}...
                    </option>
                    {serviceOptions.map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              {vertical.booking.extraFields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    {field.label}
                  </label>
                  <Input
                    type={field.type ?? "text"}
                    name={field.name}
                    placeholder={field.placeholder}
                    required={field.required}
                    min={field.type === "number" ? 1 : undefined}
                  />
                </div>
              ))}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Preferred Date
                  </label>
                  <Input type="date" name="date" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Preferred Time Window
                  </label>
                  <div className="relative">
                    <select
                      name="timeWindow"
                      defaultValue=""
                      required
                      className={selectClassName()}
                    >
                      <option value="" disabled>
                        Time Window
                      </option>
                      {vertical.booking.timeWindows.map((window) => (
                        <option key={window} value={window}>
                          {window}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  required
                  style={{ accentColor: theme.colors.primary }}
                  className="h-4 w-4 shrink-0"
                />
                I agree to be contacted about this booking
              </label>

              <Button
                type="submit"
                label={submitting ? "Sending..." : "Send"}
                disabled={submitting}
                className="w-full justify-center"
              />
              {submitError && (
                <p role="alert" className="text-sm text-red-600">
                  {submitError}
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
