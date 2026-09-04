// theme.ts — the ONE file that makes this codebase reusable for a new client. Change brand name / colors / feature flags here — never inside a component.
export const theme = {
  brandName: "Localist",
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