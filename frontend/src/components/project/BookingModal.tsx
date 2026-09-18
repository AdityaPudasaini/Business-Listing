// BookingModal.tsx — the "Booking Your Service" popup on the listing detail
// page. Wired to createBooking() in services/api.ts, which itself falls back
// to a local success state when isBackendConfigured is false (demo mode).

"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronDown, CheckCircle2 } from "lucide-react";
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

const CLOSE_ANIMATION_MS = 180;

function selectClassName() {
  return "w-full appearance-none rounded-xl border border-gray-300 bg-white px-5 py-3.5 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-400 focus:border-[var(--focus-border)] focus:ring-1 focus:ring-[var(--focus-ring)]";
}

function todayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

export function BookingModal({ business, onClose }: BookingModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const firstFieldRef = useRef<HTMLInputElement>(null);
  const vertical = getActiveVertical();

  const serviceOptions = business.services?.map((s) => s.label) ?? [];

  // Entrance animation.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  // Autofocus the first field, lock page scrolling,
  // and allow Escape to close the modal.
  useEffect(() => {
    firstFieldRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleClose() {
    if (closing) return;

    setClosing(true);

    setTimeout(() => {
      onClose();
    }, CLOSE_ANIMATION_MS);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    setSubmitting(true);
    setSubmitError("");

    try {
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
        error instanceof Error
          ? error.message
          : "We could not send your booking. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ease-out ${
          visible && !closing ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl my-8 rounded-2xl bg-white shadow-2xl p-6 sm:p-8 transition-all duration-200 ease-out ${
          visible && !closing ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X size={20} />
        </button>

        {submitted ? (
          /* Success state */
          <div className="py-6 text-center animate-fade-in-up">
            <CheckCircle2
              size={48}
              style={{ color: theme.colors.primary }}
              className="mx-auto mb-4"
            />

            <h3
              id="booking-modal-title"
              className="text-lg font-bold text-gray-900"
            >
              {vertical.id === "restaurant"
                ? "Reservation requested"
                : "Booking requested"}
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              {business.name} will confirm your request soon.
            </p>

            <Button
              label="Done"
              className="mt-6 w-full justify-center"
              onClick={handleClose}
            />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Wonderful Choice
              </p>

              <h3
                id="booking-modal-title"
                className="mt-1 text-2xl font-extrabold text-gray-900"
              >
                {vertical.labels.bookingTitle}
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Fill in your details and {business.name} will confirm your slot
                shortly.
              </p>
            </div>

            {/* Booking form */}
            <form
              onSubmit={handleSubmit}
              style={{
                ["--focus-border" as string]: theme.colors.primary,
                ["--focus-ring" as string]: theme.colors.primary,
              }}
              className="mt-7 space-y-4"
            >
              {/* First and last name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    First Name
                  </label>

                  <Input
                    ref={firstFieldRef}
                    name="firstName"
                    placeholder="First Name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Last Name
                  </label>

                  <Input name="lastName" placeholder="Last Name" required />
                </div>
              </div>

              {/* Phone and email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Phone Number
                  </label>

                  <Input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    pattern="[0-9+\-\s]{7,15}"
                    title="Enter a valid phone number"
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

              {/* Service selection */}
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

              {/* Vertical-specific fields */}
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

              {/* Date and time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Preferred Date
                  </label>

                  <Input
                    type="date"
                    name="date"
                    min={todayIsoDate()}
                    required
                  />
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

              {/* Agreement */}
              <label className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  required
                  style={{ accentColor: theme.colors.primary }}
                  className="h-4 w-4 shrink-0"
                />

                <span>I agree to be contacted about this booking</span>
              </label>

              {/* Submit */}
              <Button
                type="submit"
                label={submitting ? "Sending..." : "Send"}
                disabled={submitting}
                className="w-full justify-center"
              />

              {/* Error */}
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
