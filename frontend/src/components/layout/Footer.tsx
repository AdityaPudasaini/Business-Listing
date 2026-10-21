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
import { categories } from "@/data/categories";

const socialLinks = [
  { label: "Facebook", href: theme.social.facebook, icon: Facebook },
  { label: "Instagram", href: theme.social.instagram, icon: Instagram },
  { label: "Twitter", href: theme.social.twitter, icon: Twitter },
].filter((link) => link.href);

// Leaf categories from the bundled list (the footer is a client component, so
// it can't fetch admin-managed ones; those still get pages and sitemap entries).
const footerCategories = categories.flatMap((category) =>
  category.subCategories?.length ? category.subCategories : [category],
);

export function Footer() {
  const vertical = getActiveVertical();

  return (
    <footer className="bg-secondary text-on-dark">
      <div className="max-w-6xl mx-auto px-6 md:px-14 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand + Social */}
        <div>
          <span className="text-xl font-extrabold text-on-dark">
            {vertical.brandName}
          </span>

          <p className="mt-3 text-sm max-w-xs text-on-dark/60">
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
                  className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-primary hover:border-primary transition-colors duration-200 border-on-dark/20 text-on-dark"
                >
                  <s.icon size={16} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-on-dark">
            Quick Links
          </h3>

          <ul className="mt-4 space-y-2.5 text-sm text-on-dark/70">
            {theme.nav.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover:text-primary transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-on-dark">
            Categories
          </h3>

          <ul className="mt-4 space-y-2.5 text-sm text-on-dark/70">
            <li>
              <Link
                href="/listings"
                className="hover:text-primary transition-colors duration-200"
              >
                Browse All Listings
              </Link>
            </li>
            {/* Site-wide links to the category landing pages, so crawlers and
                visitors can reach them from any page. */}
            {footerCategories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.id}`}
                  className="hover:text-primary transition-colors duration-200"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-on-dark">
            Contact
          </h3>

          <ul className="mt-4 space-y-3 text-sm text-on-dark/70">
            <li className="flex items-start gap-2.5">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
              <span>{theme.contact.location}</span>
            </li>

            {theme.contact.phone && (
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="shrink-0 text-primary" />

                <a
                  href={`tel:${theme.contact.phone.replace(/\s+/g, "")}`}
                  className="hover:text-on-dark transition-colors duration-200"
                >
                  {theme.contact.phone}
                </a>
              </li>
            )}

            <li className="flex items-center gap-2.5">
              <Mail size={16} className="shrink-0 text-primary" />

              <a
                href={`mailto:${theme.contact.email}`}
                className="hover:text-on-dark transition-colors duration-200"
              >
                {theme.contact.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright + Legal */}
      <div className="border-t border-on-dark/10">
        <div className="max-w-6xl mx-auto px-6 md:px-14 py-5 flex flex-col items-center gap-2 text-xs sm:flex-row sm:justify-between">
          <span className="text-on-dark/50">
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
                className="hover:text-on-dark transition-colors duration-200 text-on-dark/50"
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
