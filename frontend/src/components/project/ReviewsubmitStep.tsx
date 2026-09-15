// ReviewSubmitStep.tsx — Step 5 (final) of the /register wizard: a
// read-only summary of every previous step with an "Edit" jump back into
// each one, plus the actual submit action. Not wired to a backend yet —
// there's no POST /businesses endpoint in services/api.ts — so onSubmit
// just shows a local success state, same pattern as BookingModal.tsx's
// handleSubmit. Replace the TODO below with a real
// apiPost("/businesses", {...}) once that endpoint exists.
"use client";

import { useState } from "react";
import {
  Pencil,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  Clock,
  ParkingCircle,
  CheckCircle2,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { theme } from "@/config/theme";
import { getCategoryLabel } from "@/data/categories";
import { RegisterFormData } from "@/components/sections/RegisterPage";
import { apiUpload, createListing, isBackendConfigured } from "@/services/api";

interface ReviewSubmitStepProps {
  values: RegisterFormData;
  onBack: () => void;
  onEditStep: (stepId: string) => void;
}

// Small pill used for services/amenities/payment chips throughout this
// summary — read-only version of the checkbox pills those steps use.
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        ["--accent-tint" as string]: `${theme.colors.primary}0D`,
        ["--accent-border" as string]: `${theme.colors.primary}30`,
      }}
      className="inline-flex items-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-tint)] px-3 py-1.5 text-xs font-medium text-gray-700"
    >
      {children}
    </span>
  );
}

function SectionCard({
  title,
  stepId,
  onEditStep,
  children,
}: {
  title: string;
  stepId: string;
  onEditStep: (stepId: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={() => onEditStep(stepId)}
          style={{ color: theme.colors.primary }}
          className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 transition-opacity duration-150"
        >
          <Pencil size={12} />
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-400 italic">{children}</p>;
}

// "09:00" -> "9:00 AM"
function formatTime(value: string): string {
  const [hStr, mStr] = value.split(":");
  const h = Number(hStr);
  if (Number.isNaN(h)) return value;
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${mStr} ${period}`;
}

export function ReviewSubmitStep({
  values,
  onBack,
  onEditStep,
}: ReviewSubmitStepProps) {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const bannerUrl = values.bannerImage
    ? URL.createObjectURL(values.bannerImage)
    : null;
  const businessPhotoUrl = values.businessPhoto
    ? URL.createObjectURL(values.businessPhoto)
    : null;

  async function handleSubmit() {
    if (!agreed) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      if (isBackendConfigured) {
        const [image, coverImage, gallery] = await Promise.all([
          values.businessPhoto ? apiUpload(values.businessPhoto) : undefined,
          values.bannerImage ? apiUpload(values.bannerImage) : undefined,
          Promise.all(values.galleryPhotos.map(apiUpload)),
        ]);
        await createListing({
          name: values.businessName,
          description: values.description || undefined,
          category: values.category,
          address: values.localAddress,
          latitude: values.latitude,
          longitude: values.longitude,
          phone: values.phone,
          whatsapp: values.whatsapp || undefined,
          email: values.email || undefined,
          website: values.website || undefined,
          services: values.services,
          openingHours: values.openingHours.map(({ day, open, close, closed }) => ({
            day,
            hours: closed ? "Closed" : `${open} - ${close}`,
          })),
          amenities: values.amenities,
          parkingAvailable: values.parkingAvailable ?? undefined,
          paymentMethods: values.paymentMethods,
          image,
          coverImage,
          gallery,
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      setSubmitting(false);
      setSubmitted(true);
    } catch (error) {
      setSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : "We could not submit your listing. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="py-10 text-center">
        <div
          style={{
            color: theme.colors.primary,
            ["--accent-tint" as string]: `${theme.colors.primary}14`,
          }}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-tint)]"
        >
          <CheckCircle2 size={28} />
        </div>
        <h3 className="mt-4 text-lg font-bold text-gray-900">
          Listing submitted!
        </h3>
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
          {values.businessName || "Your business"} has been submitted for
          review. We&apos;ll notify you once it&apos;s live on {theme.brandName}
          .
        </p>
        <Button
          label="Back to Home"
          className="mt-6"
          onClick={() => (window.location.href = "/")}
        />
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">
        Double-check everything below before you publish. You can jump back to
        any step to make changes.
      </p>

      <div className="space-y-4 max-w-3xl">
        {/* Business Details */}
        <SectionCard
          title="Business Details"
          stepId="details"
          onEditStep={onEditStep}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2 shrink-0">
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                {businessPhotoUrl ? (
                  <img
                    src={businessPhotoUrl}
                    alt="Business"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon size={18} className="text-gray-300" />
                )}
              </div>
              <div className="h-16 w-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Banner"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon size={18} className="text-gray-300" />
                )}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {values.businessName || (
                  <span className="text-gray-400 italic font-normal">
                    No business name yet
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {values.category ? getCategoryLabel(values.category) : "—"}
              </p>
              {values.description && (
                <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">
                  {values.description}
                </p>
              )}
              {values.galleryPhotos.length > 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  +{values.galleryPhotos.length} gallery photo
                  {values.galleryPhotos.length === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Location & Contact */}
        <SectionCard
          title="Location & Contact"
          stepId="location"
          onEditStep={onEditStep}
        >
          <div className="space-y-1.5 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
              <span>
                {values.localAddress || <EmptyHint>No address added</EmptyHint>}
              </span>
            </div>
            {values.phone && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="shrink-0 text-gray-400" />
                <span>{values.phone}</span>
              </div>
            )}
            {values.whatsapp && (
              <div className="flex items-center gap-2">
                <MessageCircle size={14} className="shrink-0 text-gray-400" />
                <span>{values.whatsapp}</span>
              </div>
            )}
            {values.email && (
              <div className="flex items-center gap-2">
                <Mail size={14} className="shrink-0 text-gray-400" />
                <span>{values.email}</span>
              </div>
            )}
            {values.website && (
              <div className="flex items-center gap-2">
                <Globe size={14} className="shrink-0 text-gray-400" />
                <span>{values.website}</span>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Services Offered */}
        <SectionCard
          title="Services Offered"
          stepId="services"
          onEditStep={onEditStep}
        >
          {values.services.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {values.services.map((s) => (
                <Chip key={s}>{s}</Chip>
              ))}
            </div>
          ) : (
            <EmptyHint>No services selected</EmptyHint>
          )}
        </SectionCard>

        {/* Hours & Amenities */}
        <SectionCard
          title="Hours & Amenities"
          stepId="hours"
          onEditStep={onEditStep}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <Clock size={14} className="mt-0.5 shrink-0 text-gray-400" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
                {values.openingHours.map((d) => (
                  <div key={d.day} className="flex justify-between gap-3">
                    <span className="text-gray-500">{d.day}</span>
                    <span
                      className={
                        d.closed ? "text-gray-400 italic" : "font-medium"
                      }
                    >
                      {d.closed
                        ? "Closed"
                        : `${formatTime(d.open)} - ${formatTime(d.close)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <ParkingCircle size={14} className="shrink-0 text-gray-400" />
              Parking:{" "}
              <span className="font-medium">
                {values.parkingAvailable === null
                  ? "Not specified"
                  : values.parkingAvailable
                    ? "Available"
                    : "Not available"}
              </span>
            </div>

            {values.amenities.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">
                  Amenities
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {values.amenities.map((a) => (
                    <Chip key={a}>{a}</Chip>
                  ))}
                </div>
              </div>
            )}

            {values.paymentMethods.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">
                  Payment
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {values.paymentMethods.map((p) => (
                    <Chip key={p}>{p}</Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Terms + submit */}
      <div className="mt-6 max-w-3xl">
        <label className="flex items-start gap-2.5 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ accentColor: theme.colors.primary }}
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          I confirm this information is accurate and I agree to{" "}
          {theme.brandName}&apos;s listing terms.
        </label>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!agreed || submitting}
          style={{ backgroundColor: theme.colors.primary }}
          className="flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Listing"}
        </button>
        {submitError && <p role="alert" className="text-sm text-red-600">{submitError}</p>}
      </div>
    </div>
  );
}
