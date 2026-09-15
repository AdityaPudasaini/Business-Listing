export type VerticalId = "auto" | "restaurant";

import { LucideIcon } from "lucide-react";

export interface BookingExtraField {
  name: string;
  label: string;
  placeholder: string;
  type?: "text" | "number";
  required?: boolean;
}

export interface HowItWorksStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface VerticalConfig {
  id: VerticalId;
  labels: {
    business: string;
    businessOwner: string;
    registrationName: string;
    registrationNamePlaceholder: string;
    registrationDescriptionPlaceholder: string;
    bookingTitle: string;
    bookingSelection: string;
    heroEyebrow: string;
    heroHeading: string;
    heroDescription: string;
    addListing: string;
    nearbyHeading: string;
    nearbyDescription: string;
    nearbyEmpty: string;
    nearbyError: string;
    categoryDescription: string;
    footerDescription: string;
    detailBookingCta: string;
    featuredTitle: string;
  };
   booking: {
    timeWindows: string[];
    extraFields: BookingExtraField[];
  };
  howItWorksSteps: HowItWorksStep[];
}
