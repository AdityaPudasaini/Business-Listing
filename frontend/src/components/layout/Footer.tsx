// Footer.tsx — the site footer, shown on every page via layout.tsx.
// Black / white / red palette — all three come from theme.ts
// (secondary = black, onDark = white, primary = red), so a rebrand only
// ever touches that one file. Contact details and social links below are
// PLACEHOLDERS — swap them for the real ones once the client provides
// them. Category links currently just go home (there's no dedicated
// /listings route with category filtering yet — see the TODOs elsewhere
// in the project for that).
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";
import { theme } from "@/config/theme";
import { categories } from "@/data/categories";

const autoSubCategories =
  categories.find((c) => c.id === "auto")?.subCategories ?? [];

const socialLinks = [
  { label: "Facebook", href: "#", icon: Facebook },
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "Twitter", href: "#", icon: Twitter },
];

// theme.colors.onDark + a hex alpha suffix — same pattern already used for
// tints elsewhere in the app (e.g. CategoryShowcase.tsx's hover tint).
const onDark = theme.colors.onDark;
const onDark70 = `${onDark}B3`; // ~70%
const onDark60 = `${onDark}99`; // ~60%
const onDark50 = `${onDark}80`; // ~50%
const onDark20 = `${onDark}33`; // ~20%
const onDark10 = `${onDark}1A`; // ~10%

export function Footer() {
  return (
    <footer style={{ backgroundColor: theme.colors.secondary, color: onDark }}>
      <div className="max-w-6xl mx-auto px-6 md:px-14 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand + social */}
        <div>
          <span style={{ color: onDark }} className="text-xl font-extrabold">
            {theme.brandName}
          </span>
          <p style={{ color: onDark60 }} className="mt-3 text-sm max-w-xs">
            Find trusted auto garages and services near you, all in one place.
          </p>
          <div className="mt-5 flex gap-3">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                style={{
                  borderColor: onDark20,
                  color: onDark,
                  ["--icon-hover" as string]: theme.colors.primary,
                }}
                className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-[var(--icon-hover)] hover:border-[var(--icon-hover)] transition-colors duration-200"
              >
                <s.icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3
            style={{ color: onDark }}
            className="text-sm font-bold uppercase tracking-wide"
          >
            Quick Links
          </h3>
          <ul style={{ color: onDark70 }} className="mt-4 space-y-2.5 text-sm">
            {theme.nav.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  style={{ ["--link-hover" as string]: theme.colors.primary }}
                  className="hover:text-[var(--link-hover)] transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3
            style={{ color: onDark }}
            className="text-sm font-bold uppercase tracking-wide"
          >
            Categories
          </h3>
          <ul style={{ color: onDark70 }} className="mt-4 space-y-2.5 text-sm">
            {autoSubCategories.slice(0, 6).map((sub) => (
              <li key={sub.id}>
                <Link
                  href="/"
                  style={{ ["--link-hover" as string]: theme.colors.primary }}
                  className="hover:text-[var(--link-hover)] transition-colors duration-200"
                >
                  {sub.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact — placeholders until real details are provided */}
        <div>
          <h3
            style={{ color: onDark }}
            className="text-sm font-bold uppercase tracking-wide"
          >
            Contact
          </h3>
          <ul style={{ color: onDark70 }} className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin
                size={16}
                className="mt-0.5 shrink-0"
                style={{ color: theme.colors.primary }}
              />
              <span>Kathmandu, Nepal</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone
                size={16}
                className="shrink-0"
                style={{ color: theme.colors.primary }}
              />
              <a
                href="tel:+9770000000000"
                style={{ ["--hover" as string]: onDark }}
                className="hover:text-[var(--hover)] transition-colors duration-200"
              >
                +977 0000000000
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail
                size={16}
                className="shrink-0"
                style={{ color: theme.colors.primary }}
              />
              <a
                href={`mailto:hello@${theme.brandName.toLowerCase()}.com`}
                style={{ ["--hover" as string]: onDark }}
                className="hover:text-[var(--hover)] transition-colors duration-200"
              >
                hello@{theme.brandName.toLowerCase()}.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${onDark10}` }}>
        <div
          style={{ color: onDark50 }}
          className="max-w-6xl mx-auto px-6 md:px-14 py-5 text-xs text-center"
        >
          © {new Date().getFullYear()} {theme.brandName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
