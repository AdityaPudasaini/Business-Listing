"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Phone, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "./RatingStars";
import { getCategoryLabel } from "@/data/categories";
import { Business } from "@/types";

interface ListingCardProps {
  business: Business;
  href: string;
}

const OPEN_ANIMATION_MS = 180;

export function ListingCard({ business, href }: ListingCardProps) {
  const hasContact = business.phone || business.whatsapp;
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);

  function openListing() {
    if (isOpening) return;

    setIsOpening(true);

    setTimeout(() => {
      router.push(href);
    }, OPEN_ANIMATION_MS);
  }

  // The title is a real <a href> so crawlers can follow it. A plain left-click
  // still plays the open animation; ctrl/cmd/shift/middle-click fall through to
  // the browser so "open in new tab" keeps working.
  function handleLinkClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    openListing();
  }

  return (
    <div className="group h-full">
      <Card
        noPadding
        className={`relative overflow-hidden h-full flex flex-col transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_16px_32px_-12px_rgb(var(--color-primary)/0.3)] ${
          isOpening ? "scale-110 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <div className="relative h-52 w-full overflow-hidden">
          <Image
            src={business.image}
            alt={business.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-110"
          />

          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-gray-800 shadow-sm">
            {getCategoryLabel(business.category)}
          </span>
        </div>

        <div className="border-t-2 border-gray-900" />

        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center justify-between gap-2">
            {/* Stretched link: the ::after overlay makes the whole card
                clickable while the markup stays a single valid <a>. Other
                links/buttons below sit on z-10 so they stay clickable. */}
            <h3 className="font-semibold text-lg text-gray-900 truncate min-w-0">
              <Link
                href={href}
                onClick={handleLinkClick}
                className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary focus-visible:after:rounded-lg"
              >
                {business.name}
              </Link>
            </h3>

            {business.rating !== undefined && (
              <RatingStars
                rating={business.rating}
                readOnly
                className="text-xl shrink-0"
              />
            )}
          </div>

          {business.reviewCount !== undefined && (
            <p className="text-sm text-gray-400 -mt-0.5">
              {business.reviewCount} reviews
            </p>
          )}

          <a
            href={
              business.latitude !== undefined &&
              business.longitude !== undefined
                ? `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${business.name}, ${business.location}`,
                  )}`
            }
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${business.name} on Google Maps`}
            className="relative z-10 mt-3 flex items-center gap-2 text-base text-gray-600 hover:text-primary transition-colors w-fit"
          >
            <MapPin size={20} className="shrink-0" />

            <span>
              {business.location}

              {business.distanceKm !== undefined && (
                <span className="text-gray-400">
                  {" · "}
                  {business.distanceKm < 1
                    ? `${Math.round(business.distanceKm * 1000)} m away`
                    : `${business.distanceKm.toFixed(1)} km away`}
                </span>
              )}
            </span>
          </a>

          {hasContact && (
            <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between gap-3">
              <div className="flex flex-col gap-2">
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="relative z-10 flex items-center gap-2 text-base text-gray-600 hover:text-gray-900"
                  >
                    <Phone size={20} className="shrink-0" />
                    {business.phone}
                  </a>
                )}

                {business.whatsapp && (
                  <a
                    href={`https://wa.me/${business.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 flex items-center gap-2 text-base text-gray-600 hover:text-gray-900"
                  >
                    <MessageCircle size={20} className="shrink-0" />
                    {business.whatsapp}
                  </a>
                )}
              </div>

              <div className="relative z-10 shrink-0">
                <Button
                  label="Explore"
                  variant="secondary"
                  className="rounded-xl text-base px-6 py-3"
                  onClick={openListing}
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
