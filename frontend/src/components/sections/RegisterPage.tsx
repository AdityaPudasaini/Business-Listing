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
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";
import { BusinessDetailsStep } from "@/components/project/BusinessDetailsStep";
import { theme } from "@/config/theme";

export interface RegisterFormData {
  businessName: string;
  description: string;
  category: string;
  businessPhoto: File | null;
  galleryPhotos: File[];
}

interface Step {
  id: string;
  label: string;
  description: string;
  icon: typeof Wrench;
}

const STEPS: Step[] = [
  {
    id: "details",
    label: "Business Details",
    description: "Tell us about your workshop",
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
    description: "Pick what your garage handles",
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

// Shared pill-shaped Back/Continue footer buttons — styled to match this
// wizard's card language specifically, distinct enough from the site-wide
// <Button> (rectangular, always full-strength color) that a bespoke pair
// made more sense than overriding that shared component's shape.
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
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<RegisterFormData>({
    businessName: "",
    description: "",
    category: "",
    businessPhoto: null,
    galleryPhotos: [],
  });

  function updateFormData(patch: Partial<RegisterFormData>) {
    setFormData((prev) => ({ ...prev, ...patch }));
  }

  const activeStep = STEPS[currentStep];
  const goNext = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div className="pt-24 sm:pt-28 pb-16 px-4 sm:px-6 md:px-10 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Step sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === currentStep;
              const isCompleted = i < currentStep;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(i)}
                  style={{
                    ["--accent" as string]: theme.colors.primary,
                    ["--accent-tint" as string]: `${theme.colors.primary}14`,
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-4 text-left border-b border-gray-100 last:border-b-0 transition-colors duration-200 ${
                    isActive ? "bg-[var(--accent-tint)]" : "hover:bg-gray-50"
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
                    {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-semibold truncate ${
                        isActive
                          ? "text-[var(--accent)]"
                          : isCompleted
                            ? "text-gray-900"
                            : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="block text-xs text-gray-400 truncate">
                      {step.description}
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
              Publishing your workshop on {theme.brandName} is completely free.
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
              />
            ) : (
              <>
                <p className="text-gray-500 text-sm">
                  This step is coming soon.
                </p>
                <WizardNavButtons onBack={goBack} onNext={goNext} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
