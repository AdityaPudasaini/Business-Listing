"use client";

import { useState, type ReactNode } from "react";
import {
  FormProvider,
  useForm,
  type FieldPath,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  AlertCircle,
} from "lucide-react";

import { BusinessDetailsStep } from "@/components/project/BusinessDetailsStep";
import { LocationContactStep } from "@/components/project/LocationContactStep";
import { ServicesStep } from "@/components/project/ServicesStep";
import { HoursAmenitiesStep } from "@/components/project/HoursAmenitiesStep";
import { ReviewSubmitStep } from "@/components/project/ReviewsubmitStep";

import { DAYS_OF_WEEK } from "@/data/amenities";
import { theme } from "@/config/theme";
import { getActiveVertical } from "@/features/verticals";
import { listingSchema } from "@/lib/validation/listing";

export interface DayHoursForm {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface RegisterFormData {
  businessName: string;
  description: string;
  category: string;

  bannerImage: File | null;
  businessPhoto: File | null;
  galleryPhotos: File[];

  localAddress: string;
  mapAddress: string;

  latitude?: number;
  longitude?: number;

  phone: string;
  whatsapp: string;
  email: string;
  website: string;

  services: string[];

  openingHours: DayHoursForm[];

  amenities: string[];
  parkingAvailable: boolean | null;
  paymentMethods: string[];
}

export type AdminListingActions = {
  onSave: (values: RegisterFormData) => void;
  onApprove: (values: RegisterFormData) => void;
  onReject: () => void;
};

export type OwnerListingActions = {
  onSave: (values: RegisterFormData) => void;
};

type ListingWizardProps = {
  initialValues?: RegisterFormData;
  adminActions?: AdminListingActions;
  ownerActions?: OwnerListingActions;
  embedded?: boolean;
};

interface Step {
  id: "details" | "location" | "services" | "hours" | "review";
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
      description: "Where customers can find it",
      icon: MapPin,
    },
    {
      id: "services",
      label: "Services Offered",
      description: "Services provided",
      icon: List,
    },
    {
      id: "hours",
      label: "Hours & Amenities",
      description: "Timings, parking and payments",
      icon: Clock,
    },
    {
      id: "review",
      label: "Review & Submit",
      description: "Review all listing details",
      icon: ClipboardList,
    },
  ];
}

function createEmptyForm(): RegisterFormData {
  return {
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
  };
}

function WizardNavButtons({
  onBack,
  onNext,
}: {
  onBack?: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
      <button
        type="button"
        onClick={onBack}
        disabled={!onBack}
        className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <button
        type="button"
        onClick={onNext}
        style={{ backgroundColor: theme.colors.primary }}
        className="flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Continue
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export function ListingWizard({
  initialValues,
  adminActions,
  ownerActions,
  embedded = false,
}: ListingWizardProps) {
  const vertical = getActiveVertical();
  const steps = getSteps(vertical.labels.business);

  const [currentStep, setCurrentStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(
    adminActions || ownerActions ? steps.length - 1 : 0,
  );
  const [stepError, setStepError] = useState("");

  const methods = useForm<RegisterFormData>({
    resolver: zodResolver(listingSchema) as Resolver<RegisterFormData>,
    defaultValues: initialValues ?? createEmptyForm(),
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const formData = methods.watch();
  const activeStep = steps[currentStep];
  const ActiveStepIcon = activeStep.icon;

  const stepFields: Record<Step["id"], FieldPath<RegisterFormData>[]> = {
    details: [
      "businessName",
      "description",
      "category",
      "bannerImage",
      "businessPhoto",
      "galleryPhotos",
    ],
    location: [
      "localAddress",
      "mapAddress",
      "latitude",
      "longitude",
      "phone",
      "whatsapp",
      "email",
      "website",
    ],
    services: ["services"],
    hours: ["openingHours", "amenities", "parkingAvailable", "paymentMethods"],
    review: [],
  };

  function updateFormData(patch: Partial<RegisterFormData>) {
    (Object.keys(patch) as Array<keyof RegisterFormData>).forEach((key) => {
      methods.setValue(key, patch[key] as never, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    });
  }

  async function goNext() {
    const valid = await methods.trigger(stepFields[activeStep.id]);

    if (!valid) {
      setStepError("Please fix the highlighted fields before continuing.");
      return;
    }

    setStepError("");

    const nextStep = Math.min(currentStep + 1, steps.length - 1);
    setCurrentStep(nextStep);
    setFurthestStep((current) => Math.max(current, nextStep));
  }

  function goBack() {
    setStepError("");
    setCurrentStep((current) => Math.max(0, current - 1));
  }

  function goToStep(index: number) {
    if (index > furthestStep) return;

    setStepError("");
    setCurrentStep(index);
  }

  function goToStepId(id: Step["id"]) {
    const index = steps.findIndex((step) => step.id === id);

    if (index !== -1) {
      goToStep(index);
    }
  }

  async function validateEverything() {
    const valid = await methods.trigger();

    if (valid) {
      setStepError("");
      return true;
    }

    const errors = methods.formState.errors;

    if (errors.businessName || errors.description || errors.category) {
      setCurrentStep(0);
    } else if (
      errors.localAddress ||
      errors.mapAddress ||
      errors.latitude ||
      errors.longitude ||
      errors.phone ||
      errors.email ||
      errors.website
    ) {
      setCurrentStep(1);
    } else if (errors.openingHours) {
      setCurrentStep(3);
    }

    setStepError("Please fix the highlighted fields before submitting.");
    return false;
  }

  const wrapperClass = embedded
    ? "bg-gray-50"
    : "min-h-screen bg-gray-50 px-4 pb-16 pt-24 sm:px-6 sm:pt-28 md:px-10";

  const contentClass = embedded
    ? "grid grid-cols-1 gap-6 md:grid-cols-[280px_minmax(0,1fr)]"
    : "mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-[280px_minmax(0,1fr)]";

  return (
    <FormProvider {...methods}>
      <div className={wrapperClass}>
        <div className={contentClass}>
          <aside className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === index;
                const isCompleted = index < furthestStep;
                const isLocked = index > furthestStep;

                return (
                  <button
                    key={step.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => goToStep(index)}
                    style={{
                      ["--accent" as string]: theme.colors.primary,
                      ["--accent-tint" as string]: `${theme.colors.primary}14`,
                    }}
                    className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-4 text-left transition last:border-b-0 ${
                      isActive
                        ? "bg-[var(--accent-tint)]"
                        : isLocked
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
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
                        className={`block truncate text-sm font-semibold ${
                          isActive
                            ? "text-[var(--accent)]"
                            : isLocked
                              ? "text-gray-400"
                              : "text-gray-900"
                        }`}
                      >
                        {step.label}
                      </span>

                      <span className="block truncate text-xs text-gray-400">
                        {isLocked
                          ? "Complete earlier steps first"
                          : step.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <BadgeCheck size={18} style={{ color: theme.colors.primary }} />
                <p className="text-sm font-semibold text-gray-900">
                  {adminActions ? "Admin review mode" : "Free to list"}
                </p>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-gray-500">
                {adminActions
                  ? "Review every submitted field before approving or rejecting this listing."
                  : `Publishing your ${vertical.labels.business} on ${vertical.brandName} is completely free.`}
              </p>
            </div>
          </aside>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-6 sm:px-8">
              <span
                style={{
                  ["--accent" as string]: theme.colors.primary,
                  ["--accent-tint" as string]: `${theme.colors.primary}14`,
                }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-tint)] text-[var(--accent)]"
              >
                <ActiveStepIcon size={20} />
              </span>

              <div>
                <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
                  {activeStep.label}
                </h1>
                <p className="text-sm text-gray-500">
                  {activeStep.description}
                </p>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8">
              {stepError && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  {stepError}
                </div>
              )}

              {activeStep.id === "details" && (
                <BusinessDetailsStep
                  values={formData}
                  onChange={updateFormData}
                  onNext={goNext}
                  navButtons={<WizardNavButtons onNext={goNext} />}
                />
              )}

              {activeStep.id === "location" && (
                <LocationContactStep
                  values={formData}
                  onChange={updateFormData}
                  onNext={goNext}
                  onBack={goBack}
                  navButtons={
                    <WizardNavButtons onBack={goBack} onNext={goNext} />
                  }
                />
              )}

              {activeStep.id === "services" && (
                <ServicesStep
                  values={formData}
                  onChange={updateFormData}
                  navButtons={
                    <WizardNavButtons onBack={goBack} onNext={goNext} />
                  }
                />
              )}

              {activeStep.id === "hours" && (
                <HoursAmenitiesStep
                  values={formData}
                  onChange={updateFormData}
                  navButtons={
                    <WizardNavButtons onBack={goBack} onNext={goNext} />
                  }
                />
              )}

              {activeStep.id === "review" && (
                <ReviewSubmitStep
                  values={formData}
                  onBack={goBack}
                  onEditStep={goToStepId}
                  onValidateEverything={validateEverything}
                  adminActions={adminActions}
                  ownerActions={ownerActions}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </FormProvider>
  );
}

export function RegisterPage() {
  return <ListingWizard />;
}
