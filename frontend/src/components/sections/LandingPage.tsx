// LandingPage.tsx — shared layout for /category/[slug] and /location/[slug].
// A server component: the heading, intro text, listing grid and links are all
// in the initial HTML, which is the whole point of these pages.

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ListingCard } from "@/components/project/ListingCard";
import { LANDING_PAGE_SIZE } from "@/lib/landing";
import type { Business } from "@/types";

export interface LandingLink {
  href: string;
  label: string;
  count: number;
}

interface LandingPageProps {
  heading: string;
  intro: string[];
  breadcrumb: { label: string; href?: string }[];
  /** Already sorted; only the first LANDING_PAGE_SIZE are shown. */
  listings: Business[];
  relatedHeading: string;
  related: LandingLink[];
  secondaryHeading: string;
  secondary: LandingLink[];
}

function LinkGroup({
  heading,
  links,
}: {
  heading: string;
  links: LandingLink[];
}) {
  if (!links.length) return null;
  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-gray-900">{heading}</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-block rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:border-primary hover:text-primary"
            >
              {link.label} <span className="text-gray-400">({link.count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LandingPage({
  heading,
  intro,
  breadcrumb,
  listings,
  relatedHeading,
  related,
  secondaryHeading,
  secondary,
}: LandingPageProps) {
  const shown = listings.slice(0, LANDING_PAGE_SIZE);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-14 md:py-14">
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-1">
          {breadcrumb.map((item, index) => (
            <li key={item.label} className="flex items-center gap-1">
              {index > 0 && <ChevronRight size={14} aria-hidden="true" />}
              {item.href ? (
                <Link href={item.href} className="hover:text-primary">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-gray-700">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <h1 className="mt-4 text-3xl font-bold text-gray-900 md:text-4xl">
        {heading}
      </h1>

      <div className="mt-4 max-w-3xl space-y-3">
        {intro.map((paragraph, index) => (
          <p key={index} className="leading-relaxed text-gray-600">
            {paragraph}
          </p>
        ))}
      </div>

      <section className="mt-10" aria-label="Listings">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((business) => (
            <ListingCard
              key={business.id}
              business={business}
              href={`/listings/${business.slug}`}
            />
          ))}
        </div>

        {listings.length > shown.length && (
          <p className="mt-8 text-center text-sm text-gray-500">
            Showing {shown.length} of {listings.length}.{" "}
            <Link
              href="/listings"
              className="font-medium text-primary underline"
            >
              Browse all listings
            </Link>
          </p>
        )}
      </section>

      <LinkGroup heading={relatedHeading} links={related} />
      <LinkGroup heading={secondaryHeading} links={secondary} />
    </div>
  );
}
