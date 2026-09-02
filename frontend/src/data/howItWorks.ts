// howItWorks.ts — content for the "How it works" section: the ordered steps
// and the two collage photos. Kept as data (not hardcoded in HowItWorks.tsx)
// so a new client can swap steps/photos without touching the component.
import { Search, Calendar, ExternalLink, LucideIcon } from "lucide-react";
import { theme } from "@/config/theme";

export interface HowItWorksStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const howItWorksSteps: HowItWorksStep[] = [
  {
    icon: Search,
    title: `Browse ${theme.brandName}`,
    description: "Find verified garages and services near you, filtered by category and location.",
  },
  {
    icon: Calendar,
    title: "Book Online",
    description: "Call or message the services directly and schedule your service in minutes.",
  },
  {
    icon: ExternalLink,
    title: "Get Services",
    description: "Drop off your vehicle and get it back running smoothly, right on schedule.",
  },
];

export const howItWorksImages = {
  main: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80",
  overlay: "https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=400&q=80",
};