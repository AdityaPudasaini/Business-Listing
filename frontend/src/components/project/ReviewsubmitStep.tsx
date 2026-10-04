"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Clock,
  ParkingCircle,
  CheckCircle2,
} from "lucide-react";
import { TiktokIcon } from "@/components/icons/TiktokIcon";
import { Button } from "@/components/ui/Button";
import { getActiveVertical } from "@/features/verticals";
import { getCategoryLabel } from "@/data/categories";
import {
  RegisterFormData,
  AdminListingActions,
  OwnerListingActions,
} from "@/components/sections/RegisterPage";
import {
  createListing,
  isBackendConfigured,
  assertDemoMode,
} from "@/services/api";
import { resolveGallery, resolveImage } from "@/lib/resolveListingImage";
import { backendSupports } from "@/config/integration";

interface ReviewSubmitStepProps {
  values: RegisterFormData;
  onBack: () => void;
  onEditStep: (
    stepId: "details" | "location" | "services" | "hours" | "review",
  ) => void;

  // Added for Week 6 validation.
  onValidateEverything: () => Promise<boolean>;

  adminActions?: AdminListingActions;
  ownerActions?: OwnerListingActions;
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-lg border border-primary/[0.19] bg-primary/5 px-3 py-1.5 text-xs font-medium text-gray-700">
      {children}
    </span>
  );
}

function SectionCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>

        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 text-xs font-semibold hover:opacity-70 text-primary"
        >
          <Pencil size={12} />
          Edit
        </button>
      </div>

      {children}
    </div>
  );
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":");
  const number = Number(hour);

  if (Number.isNaN(number)) return value;

  const suffix = number >= 12 ? "PM" : "AM";
  const formattedHour = number % 12 === 0 ? 12 : number % 12;

  return `${formattedHour}:${minute} ${suffix}`;
}

export function ReviewSubmitStep({
  values,
  onBack,
  onEditStep,
  onValidateEverything,
  adminActions,
  ownerActions,
}: ReviewSubmitStepProps) {
  const router = useRouter();
  const vertical = getActiveVertical();

  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmingReject, setConfirmingReject] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState("");

  async function handleOwnerSubmit() {
    if (!agreed) return;

    const formIsValid = await onValidateEverything();

    if (!formIsValid) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      if (isBackendConfigured) {
        let image: string | null | undefined;
        let coverImage: string | null | undefined;
        let gallery: string[] = [];

        if (backendSupports.uploads) {
          [image, coverImage, gallery] = await Promise.all([
            resolveImage(values.businessPhoto),
            resolveImage(values.bannerImage),
            resolveGallery(values.galleryPhotos),
          ]);
        }

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
          facebook: values.facebook || undefined,
          instagram: values.instagram || undefined,
          tiktok: values.tiktok || undefined,
          linkedin: values.linkedin || undefined,
          services: values.services,

          openingHours: values.openingHours.map((item) => ({
            day: item.day,
            hours: item.closed ? "Closed" : `${item.open} - ${item.close}`,
          })),

          amenities: values.amenities,
          parkingAvailable: values.parkingAvailable ?? undefined,
          paymentMethods: values.paymentMethods,

          image,
          coverImage,
          gallery,
        });
      } else {
        assertDemoMode();
      }

      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not submit your listing. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOwnerSave() {
    if (!ownerActions) return;

    const formIsValid = await onValidateEverything();

    if (!formIsValid) return;

    ownerActions.onSave(values);
  }

  // Two-step inline confirm instead of window.confirm(), matching the admin
  // delete buttons.
  async function handleAdminReject() {
    if (!adminActions) return;
    setRejecting(true);
    setRejectError("");
    try {
      await adminActions.onReject();
    } catch (reason) {
      setRejectError(
        reason instanceof Error
          ? reason.message
          : "Could not reject this listing.",
      );
      setConfirmingReject(false);
    } finally {
      setRejecting(false);
    }
  }

  async function handleAdminSave() {
    if (!adminActions) return;

    const formIsValid = await onValidateEverything();

    if (!formIsValid) return;

    adminActions.onSave(values);
  }

  async function handleAdminApprove() {
    if (!adminActions) return;

    const formIsValid = await onValidateEverything();

    if (!formIsValid) return;

    adminActions.onApprove(values);
  }

  if (submitted) {
    return (
      <div className="py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/[0.08] text-primary">
          <CheckCircle2 size={28} />
        </div>

        <h3 className="mt-4 text-lg font-bold text-gray-900">
          Listing submitted!
        </h3>

        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
          Your business has been submitted for review.
        </p>

        <Button
          label="Back to Home"
          className="mt-6"
          onClick={() => router.push("/")}
        />
      </div>
    );
  }

  return (
    <div>
      <p className="mb-5 text-sm text-gray-500">
        {adminActions
          ? "Review the submitted details. Use Edit beside any section to correct it before approving."
          : "Double-check everything below before submitting your listing."}
      </p>

      <div className="max-w-3xl space-y-4">
        <SectionCard
          title="Business Details"
          onEdit={() => onEditStep("details")}
        >
          <p className="font-semibold text-gray-900">{values.businessName}</p>

          <p className="mt-0.5 text-xs text-gray-500">
            {values.category
              ? getCategoryLabel(values.category)
              : "No category"}
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            {values.description || "No description supplied."}
          </p>
        </SectionCard>

        <SectionCard
          title="Location & Contact"
          onEdit={() => onEditStep("location")}
        >
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0 text-gray-400" />
              {values.localAddress || "No address supplied"}
            </p>

            <p className="flex items-center gap-2">
              <Phone size={15} className="shrink-0 text-gray-400" />
              {values.phone || "No phone supplied"}
            </p>

            {values.whatsapp && (
              <p className="flex items-center gap-2">
                <MessageCircle size={15} className="shrink-0 text-gray-400" />
                {values.whatsapp}
              </p>
            )}

            {values.email && (
              <p className="flex items-center gap-2">
                <Mail size={15} className="shrink-0 text-gray-400" />
                {values.email}
              </p>
            )}

            {values.website && (
              <p className="flex items-center gap-2">
                <Globe size={15} className="shrink-0 text-gray-400" />
                {values.website}
              </p>
            )}

            {values.facebook && (
              <p className="flex items-center gap-2">
                <Facebook size={15} className="shrink-0 text-gray-400" />
                {values.facebook}
              </p>
            )}

            {values.instagram && (
              <p className="flex items-center gap-2">
                <Instagram size={15} className="shrink-0 text-gray-400" />
                {values.instagram}
              </p>
            )}

            {values.tiktok && (
              <p className="flex items-center gap-2">
                <TiktokIcon size={15} className="shrink-0 text-gray-400" />
                {values.tiktok}
              </p>
            )}

            {values.linkedin && (
              <p className="flex items-center gap-2">
                <Linkedin size={15} className="shrink-0 text-gray-400" />
                {values.linkedin}
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Services Offered"
          onEdit={() => onEditStep("services")}
        >
          {values.services.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {values.services.map((service) => (
                <Chip key={service}>{service}</Chip>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-gray-400">
              No services selected.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Hours & Amenities"
          onEdit={() => onEditStep("hours")}
        >
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <Clock size={15} className="mt-0.5 shrink-0 text-gray-400" />

              <div className="grid flex-1 grid-cols-1 gap-1 text-xs text-gray-600 sm:grid-cols-2">
                {values.openingHours.map((item) => (
                  <div key={item.day} className="flex justify-between gap-3">
                    <span>{item.day}</span>

                    <span className={item.closed ? "italic text-gray-400" : ""}>
                      {item.closed
                        ? "Closed"
                        : `${formatTime(item.open)} – ${formatTime(item.close)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="flex items-center gap-2 text-xs text-gray-600">
              <ParkingCircle size={15} className="text-gray-400" />
              Parking:{" "}
              <strong>
                {values.parkingAvailable === null
                  ? "Not specified"
                  : values.parkingAvailable
                    ? "Available"
                    : "Not available"}
              </strong>
            </p>

            {values.amenities.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">
                  Amenities
                </p>

                <div className="flex flex-wrap gap-2">
                  {values.amenities.map((amenity) => (
                    <Chip key={amenity}>{amenity}</Chip>
                  ))}
                </div>
              </div>
            )}

            {values.paymentMethods.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500">
                  Payment methods
                </p>

                <div className="flex flex-wrap gap-2">
                  {values.paymentMethods.map((method) => (
                    <Chip key={method}>{method}</Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {adminActions ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {confirmingReject ? (
              <div className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 py-1 pl-4 pr-1">
                <span className="text-sm font-semibold text-red-700">
                  Reject this listing?
                </span>
                <button
                  type="button"
                  disabled={rejecting}
                  onClick={() => void handleAdminReject()}
                  className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {rejecting ? "Rejecting…" : "Reject"}
                </button>
                <button
                  type="button"
                  disabled={rejecting}
                  onClick={() => setConfirmingReject(false)}
                  className="rounded-full px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-white disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingReject(true)}
                className="rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Reject listing
              </button>
            )}

            <button
              type="button"
              onClick={handleAdminSave}
              className="rounded-full border px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 border-primary text-primary"
            >
              Save edits
            </button>

            <button
              type="button"
              onClick={handleAdminApprove}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 bg-primary"
            >
              Approve & publish
            </button>
          </div>

          {rejectError && (
            <p
              role="alert"
              className="w-full text-right text-sm font-medium text-red-600"
            >
              {rejectError}
            </p>
          )}
        </div>
      ) : ownerActions ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>

          <button
            type="button"
            onClick={handleOwnerSave}
            className="rounded-full px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 bg-primary"
          >
            Save changes for review
          </button>
        </div>
      ) : (
        <>
          <label className="mt-6 flex cursor-pointer items-start gap-2.5 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
            />
            I confirm this information is accurate and agree to{" "}
            {vertical.brandName}&apos;s listing terms.
          </label>

          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleOwnerSubmit}
              disabled={!agreed || submitting}
              className="rounded-full px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 bg-primary"
            >
              {submitting ? "Submitting..." : "Submit Listing"}
            </button>
          </div>

          {submitError && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {submitError}
            </p>
          )}
        </>
      )}
    </div>
  );
}
