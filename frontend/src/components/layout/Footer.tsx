// Footer.tsx — the site footer, shown on every page via layout.tsx.

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
import { getActiveVertical } from "@/features/verticals";

const socialLinks = [
  { label: "Facebook", href: theme.social.facebook, icon: Facebook },
  { label: "Instagram", href: theme.social.instagram, icon: Instagram },
  { label: "Twitter", href: theme.social.twitter, icon: Twitter },
].filter((link) => link.href);

const onDark = theme.colors.onDark;
const onDark70 = `${onDark}B3`;
const onDark60 = `${onDark}99`;
const onDark50 = `${onDark}80`;
const onDark20 = `${onDark}33`;
const onDark10 = `${onDark}1A`;

export function Footer() {
  const vertical = getActiveVertical();

  return (
    <footer
      style={{
        backgroundColor: theme.colors.secondary,
        color: onDark,
      }}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-14 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand + Social */}
        <div>
          <span style={{ color: onDark }} className="text-xl font-extrabold">
            {vertical.brandName}
          </span>

          <p style={{ color: onDark60 }} className="mt-3 text-sm max-w-xs">
            {vertical.labels.footerDescription}
          </p>

          {socialLinks.length > 0 && (
            <div className="mt-5 flex gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
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
          )}
        </div>

        {/* Quick Links */}
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
                  style={{
                    ["--link-hover" as string]: theme.colors.primary,
                  }}
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
            <li>
              <Link
                href="/listings"
                style={{
                  ["--link-hover" as string]: theme.colors.primary,
                }}
                className="hover:text-[var(--link-hover)] transition-colors duration-200"
              >
                Browse All Listings
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
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
                style={{
                  ["--hover" as string]: onDark,
                }}
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
                href={`mailto:hello@${vertical.brandName
                  .toLowerCase()
                  .replace(/\s+/g, "")}.com`}
                style={{
                  ["--hover" as string]: onDark,
                }}
                className="hover:text-[var(--hover)] transition-colors duration-200"
              >
                hello@
                {vertical.brandName.toLowerCase().replace(/\s+/g, "")}.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright + Legal */}
      <div style={{ borderTop: `1px solid ${onDark10}` }}>
        <div className="max-w-6xl mx-auto px-6 md:px-14 py-5 flex flex-col items-center gap-2 text-xs sm:flex-row sm:justify-between">
          <span style={{ color: onDark50 }}>
            © {new Date().getFullYear()} {vertical.brandName}. All rights
            reserved.
          </span>

          <nav aria-label="Legal" className="flex items-center gap-5">
            {[
              { href: "/terms", label: "Terms and Conditions" },
              { href: "/privacy", label: "Privacy Policy" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  color: onDark50,
                  ["--link-hover" as string]: onDark,
                }}
                className="hover:text-[var(--link-hover)] transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
