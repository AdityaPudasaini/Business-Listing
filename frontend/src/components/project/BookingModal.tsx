"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, ChevronDown, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { theme } from "@/config/theme";
import type { Business } from "@/types";
import { ApiError, createBooking, isBackendConfigured } from "@/services/api";
import { getAccessToken } from "@/services/authToken";
import { getActiveVertical } from "@/features/verticals";
import { bookingSchema } from "@/lib/validation/interaction";
import type { z } from "zod";

interface BookingModalProps {
  business: Business;
  onClose: () => void;
}

type BookingFormValues = z.infer<typeof bookingSchema>;

const CLOSE_ANIMATION_MS = 180;

function selectClassName(hasError: boolean) {
  return `w-full appearance-none rounded-xl border bg-white px-5 py-3.5 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-gray-400 focus:border-[var(--focus-border)] focus:ring-1 focus:ring-[var(--focus-ring)] ${
    hasError ? "border-red-500" : "border-gray-300"
  }`;
}

function todayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

export function BookingModal({ business, onClose }: BookingModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const vertical = getActiveVertical();

  const serviceOptions =
    business.services?.map((service) => service.label) ?? [];

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      service: "",
      date: "",
      timeWindow: "",
      extra: {},
      agreed: false,
    },
  });

  const firstNameRegister = register("firstName");

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => setVisible(true));

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    firstFieldRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
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

  async function onSubmit(values: BookingFormValues) {
    let hasExtraFieldErrors = false;

    vertical.booking.extraFields.forEach((field) => {
      const value = values.extra[field.name]?.trim() ?? "";

      if (field.required && value === "") {
        hasExtraFieldErrors = true;

        setError(`extra.${field.name}`, {
          type: "required",
          message: `${field.label} is required.`,
        });
      }
    });

    if (hasExtraFieldErrors) return;

    // POST /bookings needs a logged-in user. Say so plainly instead of
    // letting the request fail with a raw 401 message.
    if (isBackendConfigured && !getAccessToken()) {
      setNeedsLogin(true);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setNeedsLogin(false);

    try {
      if (isBackendConfigured) {
        await createBooking({
          businessId: business.id,
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          phone: values.phone.trim(),
          email: values.email.trim() || undefined,
          service: values.service,
          date: values.date,
          timeWindow: values.timeWindow,
          details: values.extra,
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      setSubmitted(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setNeedsLogin(true);
        return;
      }
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not send your booking. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Rendered through a portal on document.body. The page content is wrapped in
  // PageTransition (animate-fade-in-up, `both` fill-mode), which leaves a
  // transform on the wrapper. A transformed ancestor becomes the containing
  // block for `position: fixed`, so without the portal this overlay was sized
  // and centred against the whole (tall) page instead of the viewport.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 flex overflow-y-auto p-4 sm:py-8"
    >
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ease-out ${
          visible && !closing ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`relative m-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl transition-all duration-200 ease-out sm:p-8 ${
          visible && !closing ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-700"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="py-6 text-center">
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

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              style={{
                ["--focus-border" as string]: theme.colors.primary,
                ["--focus-ring" as string]: theme.colors.primary,
              }}
              className="mt-7 space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                    First Name
                  </label>

                  <div
                    className={
                      errors.firstName ? "rounded-xl ring-1 ring-red-500" : ""
                    }
                  >
                    <Input
                      {...firstNameRegister}
                      ref={(element) => {
                        firstFieldRef.current = element;
                        firstNameRegister.ref(element);
                      }}
                      placeholder="First Name"
                      autoComplete="given-name"
                      aria-invalid={Boolean(errors.firstName)}
                    />
                  </div>

                  {errors.firstName && (
                    <p role="alert" className="mt-1.5 text-sm text-red-600">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                    Last Name
                  </label>

                  <div
                    className={
                      errors.lastName ? "rounded-xl ring-1 ring-red-500" : ""
                    }
                  >
                    <Input
                      placeholder="Last Name"
                      autoComplete="family-name"
                      aria-invalid={Boolean(errors.lastName)}
                      {...register("lastName")}
                    />
                  </div>

                  {errors.lastName && (
                    <p role="alert" className="mt-1.5 text-sm text-red-600">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                    Phone Number
                  </label>

                  <div
                    className={
                      errors.phone ? "rounded-xl ring-1 ring-red-500" : ""
                    }
                  >
                    <Input
                      type="tel"
                      placeholder="+977 98XXXXXXXX"
                      autoComplete="tel"
                      aria-invalid={Boolean(errors.phone)}
                      {...register("phone")}
                    />
                  </div>

                  {errors.phone && (
                    <p role="alert" className="mt-1.5 text-sm text-red-600">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                    Email
                  </label>

                  <div
                    className={
                      errors.email ? "rounded-xl ring-1 ring-red-500" : ""
                    }
                  >
                    <Input
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      aria-invalid={Boolean(errors.email)}
                      {...register("email")}
                    />
                  </div>

                  {errors.email && (
                    <p role="alert" className="mt-1.5 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                  {vertical.labels.bookingSelection}
                </label>

                <div className="relative">
                  <select
                    aria-invalid={Boolean(errors.service)}
                    className={selectClassName(Boolean(errors.service))}
                    {...register("service")}
                  >
                    <option value="">
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

                {errors.service && (
                  <p role="alert" className="mt-1.5 text-sm text-red-600">
                    {errors.service.message}
                  </p>
                )}
              </div>

              {vertical.booking.extraFields.map((field) => {
                const fieldError = errors.extra?.[field.name]?.message;

                return (
                  <div key={field.name}>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                      {field.label}
                      {field.required && (
                        <span className="ml-0.5 text-red-600">*</span>
                      )}
                    </label>

                    <div
                      className={
                        fieldError ? "rounded-xl ring-1 ring-red-500" : ""
                      }
                    >
                      <Input
                        type={field.type ?? "text"}
                        placeholder={field.placeholder}
                        min={field.type === "number" ? 1 : undefined}
                        aria-invalid={Boolean(fieldError)}
                        {...register(`extra.${field.name}`)}
                      />
                    </div>

                    {fieldError && (
                      <p role="alert" className="mt-1.5 text-sm text-red-600">
                        {fieldError}
                      </p>
                    )}
                  </div>
                );
              })}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                    Preferred Date
                  </label>

                  <div
                    className={
                      errors.date ? "rounded-xl ring-1 ring-red-500" : ""
                    }
                  >
                    <Input
                      type="date"
                      min={todayIsoDate()}
                      aria-invalid={Boolean(errors.date)}
                      {...register("date")}
                    />
                  </div>

                  {errors.date && (
                    <p role="alert" className="mt-1.5 text-sm text-red-600">
                      {errors.date.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                    Preferred Time Window
                  </label>

                  <div className="relative">
                    <select
                      aria-invalid={Boolean(errors.timeWindow)}
                      className={selectClassName(Boolean(errors.timeWindow))}
                      {...register("timeWindow")}
                    >
                      <option value="">Time Window</option>

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

                  {errors.timeWindow && (
                    <p role="alert" className="mt-1.5 text-sm text-red-600">
                      {errors.timeWindow.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    style={{ accentColor: theme.colors.primary }}
                    className="h-4 w-4 shrink-0"
                    {...register("agreed")}
                  />

                  <span>I agree to be contacted about this booking</span>
                </label>

                {errors.agreed && (
                  <p role="alert" className="mt-1.5 text-sm text-red-600">
                    {errors.agreed.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                label={submitting ? "Sending..." : "Send"}
                disabled={submitting}
                className="w-full justify-center"
              />

              {needsLogin && (
                <p role="alert" className="text-sm text-red-600">
                  Please{" "}
                  <Link href="/login" className="font-bold underline">
                    log in
                  </Link>{" "}
                  (or{" "}
                  <Link href="/signup" className="font-bold underline">
                    create an account
                  </Link>
                  ) to send a booking request.
                </p>
              )}

              {submitError && (
                <p role="alert" className="text-sm text-red-600">
                  {submitError}
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
