// RegisterPage.tsx
"use client";

import { useState } from "react";
import {
  Wrench,
  MapPin,
  List,
  Clock,
  ClipboardList,
  Check,
  Lock,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";
import { BusinessDetailsStep } from "@/components/project/BusinessDetailsStep";
import { LocationContactStep } from "@/components/project/LocationContactStep";
import { ServicesStep } from "@/components/project/ServicesStep";
import { HoursAmenitiesStep } from "@/components/project/HoursAmenitiesStep";
import { ReviewSubmitStep } from "@/components/project/ReviewsubmitStep";
import { DAYS_OF_WEEK } from "@/data/amenities";
import { theme } from "@/config/theme";
import { getActiveVertical } from "@/features/verticals";

export interface DayHoursForm {
  day: string;
  open: string; // "HH:MM", 24-hour — matches <input type="time"> value format
  close: string;
  closed: boolean;
}

export interface RegisterFormData {
  // Step 1 — Business Details
  businessName: string;
  description: string;
  category: string;
  bannerImage: File | null;
  businessPhoto: File | null;
  galleryPhotos: File[];
  // Step 2 — Location & Contact
  localAddress: string;
  mapAddress: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  // Step 3 — Services Offered
  services: string[];
  // Step 4 — Hours & Amenities
  openingHours: DayHoursForm[];
  amenities: string[];
  parkingAvailable: boolean | null;
  paymentMethods: string[];
}

interface Step {
  id: string;
  label: string;
  description: string;
  icon: typeof Wrench;
}

function getSteps(business: string): Step[] {
  return [
  {
    id: "details",
    label: "Business Details",
    description: `Tell us about your ${business}`,
    icon: Wrench,
  },
  {
    id: "location",
    label: "Location & Contact",
    description: "Where can customers find you",
    icon: MapPin,
  },
  {
    id: "services",
    label: "Services Offered",
    description: "Choose the services you offer",
    icon: List,
  },
  {
    id: "hours",
    label: "Hours & Amenities",
    description: "Timings, parking & payments",
    icon: Clock,
  },
  {
    id: "review",
    label: "Review & Submit",
    description: "Confirm and publish your listing",
    icon: ClipboardList,
  },
  ];
}

// Shared pill-shaped Back/Continue footer. Every step receives one of these
// as its `navButtons` prop instead of building its own, so the footer stays
// visually and behaviorally identical across every step, and each step's
// own "can I proceed?" validation is computed once, here, rather than
// duplicated inside every step component.
function WizardNavButtons({
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel = "Continue",
}: {
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={!onBack}
        className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors duration-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} />
        Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        style={{ backgroundColor: theme.colors.primary }}
        className="flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {nextLabel}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export function RegisterPage() {
  const vertical = getActiveVertical();
  const steps = getSteps(vertical.labels.business);
  const [currentStep, setCurrentStep] = useState(0);
  // The furthest step index the user has actually earned by passing
  // validation on every step before it. Sidebar clicks and "Continue" can
  // only ever reach up to this point — steps beyond it are locked.
  const [furthestStep, setFurthestStep] = useState(0);

  const [formData, setFormData] = useState<RegisterFormData>({
    businessName: "",
    description: "",
    category: "",
    bannerImage: null,
    businessPhoto: null,
    galleryPhotos: [],
    localAddress: "",
    mapAddress: "",
    latitude: undefined,
    longitude: undefined,
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    services: [],
    openingHours: DAYS_OF_WEEK.map((day) => ({
      day,
      open: "09:00",
      close: "18:00",
      closed: false,
    })),
    amenities: [],
    parkingAvailable: null,
    paymentMethods: [],
  });

  function updateFormData(patch: Partial<RegisterFormData>) {
    setFormData((prev) => ({ ...prev, ...patch }));
  }

  const activeStep = steps[currentStep];

  // Only Business Name and Category are marked required on Step 1
  // (see BusinessDetailsStep's <RequiredMark /> usage).
  const canProceedDetails =
    formData.businessName.trim().length > 0 && formData.category.length > 0;

  // Local Address, a resolved map location, and Phone are required on Step 2.
  const canProceedLocation =
    formData.localAddress.trim().length > 0 &&
    formData.latitude !== undefined &&
    formData.longitude !== undefined &&
    formData.phone.trim().length > 0;

  // Steps 3–5 have no required fields — Services is optional (a business
  // can add these later), and Hours/Review still have no real fields yet.
  const canProceedByStep: Record<string, boolean> = {
    details: canProceedDetails,
    location: canProceedLocation,
    services: true,
    hours: true,
    review: true,
  };

  function goNext() {
    if (!canProceedByStep[activeStep.id]) return; // guards direct calls too, not just the disabled button
    const next = Math.min(currentStep + 1, steps.length - 1);
    setCurrentStep(next);
    setFurthestStep((f) => Math.max(f, next));
  }

  function goBack() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  function goToStep(i: number) {
    if (i > furthestStep) return; // locked — hasn't been earned yet
    setCurrentStep(i);
  }

  // Used by ReviewSubmitStep's per-section "Edit" links, which know the
  // step id (e.g. "details") they belong to, not its numeric index.
  function goToStepId(id: string) {
    const index = steps.findIndex((s) => s.id === id);
    if (index !== -1) goToStep(index);
  }

  return (
    <div className="pt-24 sm:pt-28 pb-16 px-4 sm:px-6 md:px-10 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Step sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === currentStep;
              const isCompleted = i < furthestStep;
              const isLocked = i > furthestStep;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(i)}
                  disabled={isLocked}
                  style={{
                    ["--accent" as string]: theme.colors.primary,
                    ["--accent-tint" as string]: `${theme.colors.primary}14`,
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-left border-b border-gray-100 last:border-b-0 transition-colors duration-200 ${
                    isActive
                      ? "bg-[var(--accent-tint)]"
                      : isLocked
                        ? "cursor-not-allowed"
                        : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                      isActive
                        ? "bg-[var(--accent)] text-white"
                        : isCompleted
                          ? "bg-[var(--accent-tint)] text-[var(--accent)]"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={16} />
                    ) : isLocked ? (
                      <Lock size={14} />
                    ) : (
                      <Icon size={16} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-semibold truncate ${
                        isActive
                          ? "text-[var(--accent)]"
                          : isLocked
                            ? "text-gray-400"
                            : isCompleted
                              ? "text-gray-900"
                              : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="block text-xs text-gray-400 truncate">
                      {isLocked
                        ? "Complete the steps above first"
                        : step.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Free to list info card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <BadgeCheck size={18} style={{ color: theme.colors.primary }} />
              <span className="font-semibold text-gray-900 text-sm">
                Free to list
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Publishing your {vertical.labels.business} on {theme.brandName} is completely free.
              Get discovered by thousands of customers nearby.
            </p>
          </div>
        </div>

        {/* Step content card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 sm:px-8 py-6 border-b border-gray-100">
            <span
              style={{
                ["--accent" as string]: theme.colors.primary,
                ["--accent-tint" as string]: `${theme.colors.primary}14`,
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-tint)] text-[var(--accent)]"
            >
              <activeStep.icon size={20} />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                {activeStep.label}
              </h1>
              <p className="text-sm text-gray-500">{activeStep.description}</p>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-6">
            {activeStep.id === "details" ? (
              <BusinessDetailsStep
                values={formData}
                onChange={updateFormData}
                onNext={goNext}
                navButtons={
                  <WizardNavButtons
                    onNext={goNext}
                    nextDisabled={!canProceedDetails}
                  />
                }
              />
            ) : activeStep.id === "location" ? (
              <LocationContactStep
                values={formData}
                onChange={updateFormData}
                onNext={goNext}
                onBack={goBack}
                navButtons={
                  <WizardNavButtons
                    onBack={goBack}
                    onNext={goNext}
                    nextDisabled={!canProceedLocation}
                  />
                }
              />
            ) : activeStep.id === "services" ? (
              <ServicesStep
                values={formData}
                onChange={updateFormData}
                navButtons={
                  <WizardNavButtons onBack={goBack} onNext={goNext} />
                }
              />
            ) : activeStep.id === "hours" ? (
              <HoursAmenitiesStep
                values={formData}
                onChange={updateFormData}
                navButtons={
                  <WizardNavButtons onBack={goBack} onNext={goNext} />
                }
              />
            ) : (
              <ReviewSubmitStep
                values={formData}
                onBack={goBack}
                onEditStep={goToStepId}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
