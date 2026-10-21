// theme.ts — the ONE file that makes this codebase reusable for a new client. Change brand name / colors / feature flags here — never inside a component.
import type React from "react";
import { getActiveVertical } from "@/features/verticals";

export const theme = {
  brandName: getActiveVertical().brandName, // follows NEXT_PUBLIC_VERTICAL — do not hardcode
  logoUrl: "", // set to e.g. "/logo.svg" (in the public/ folder) once a logo asset exists — leave empty to show brandName as text
  colors: {
    primary: "#B11226",
    secondary: "#000000",
    accent: "#D4AF37",
    navBg: "#E6E6E6",
    surface: "#F6E2DC", 
    muted: "#E5E7EB", // neutral gray background for CTA bands / alt sections — kept separate from `surface` (brand tint) so it can be changed independently
    onDark: "#FFFFFF", // text/icon/border color used on dark backgrounds (e.g. Footer) — kept separate from Tailwind's built-in white so it's swappable from this one file too
    footerBg: "#1F2937", // dark charcoal gray for the Footer — kept separate from `secondary` (pure black) so the footer tone can be adjusted without affecting the dark Button variant elsewhere
  },
  // Footer / privacy-page contact details. Leave phone empty to hide it.
  // TODO: replace with the client's real contact details before launch.
  contact: {
    email: "hello@autohub.com",
    phone: "", // e.g. "+977 1 4XXXXXX"
    location: "Kathmandu, Nepal",
  },
  // Leave a value empty and that icon is hidden from the footer.
  social: {
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK?.trim() || "",
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM?.trim() || "",
    twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER?.trim() || "",
  },
  features: {
    booking: true,
    gallery: true,
    reviews: true,
  },
  nav: {
    links: [
      { label: "Home", href: "/" },
      { label: "Listings", href: "/listings" },
      { label: "About Us", href: "/about" },
      { label: "Register Your Business", href: "/register" },
    ],
  },
};

// "#B11226" -> "177 18 38", the channel format Tailwind needs for opacity
// modifiers like bg-primary/10.
function hexToRgbChannels(hex: string) {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function toKebab(key: string) {
  return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

// Applied once on <html> in app/layout.tsx. Components use the Tailwind
// classes (bg-primary, text-primary/70, ...) instead of reading theme.colors.
export const themeCssVariables = Object.fromEntries(
  Object.entries(theme.colors).map(([key, hex]) => [
    `--color-${toKebab(key)}`,
    hexToRgbChannels(hex),
  ]),
) as React.CSSProperties;
