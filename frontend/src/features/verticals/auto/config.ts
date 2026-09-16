import { Search, Calendar, ExternalLink } from "lucide-react";
import { VerticalConfig } from "../types";
import { theme } from "@/config/theme";

export const autoConfig: VerticalConfig = {
  id: "auto",
  brandName: theme.brandName,
  labels: {
    business: "garage or workshop",
    businessOwner: "workshop owner",
    registrationName: "Garage / Workshop name",
    registrationNamePlaceholder: "e.g. Himalayan Auto Care",
    registrationDescriptionPlaceholder: "Tell customers about your workshop, experience, and services...",
    bookingTitle: "Book Your Service",
    bookingSelection: "Service Details",
    heroEyebrow: "Trusted reviews from your neighbors",
    heroHeading: "Discover the best auto care",
    heroDescription: "Find the right service for and near you.",
    addListing: "Add Listing",
    nearbyHeading: "Your Nearest Auto Service",
    nearbyDescription: "Find the closest and most reliable auto services in your area",
    nearbyEmpty: "No nearby services found yet.",
    nearbyError: "Couldn't load nearby services. Please try again shortly.",
    categoryDescription: "Browse auto services by category.",
    footerDescription: "Find trusted auto garages and services near you, all in one place.",
    detailBookingCta: "Booking Your Service",
    featuredTitle: "Our Featured Brands",
  },
  booking: {
    timeWindows: [
      "Morning (9am - 12pm)",
      "Afternoon (12pm - 4pm)",
      "Evening (4pm - 7pm)",
    ],
    extraFields: [
      {
        name: "vehicle",
        label: "Vehicle Details",
        placeholder: "Vehicle make, model, and registration number",
        required: true,
      },
    ],
  },
  howItWorksSteps: [
    {
      icon: Search,
      title: `Browse ${theme.brandName}`,
      description:
        "Find verified garages and services near you, filtered by category and location.",
    },
    {
      icon: Calendar,
      title: "Book Online",
      description:
        "Call or message the services directly and schedule your service in minutes.",
    },
    {
      icon: ExternalLink,
      title: "Get Services",
      description:
        "Drop off your vehicle and get it back running smoothly, right on schedule.",
    },
  ],
};