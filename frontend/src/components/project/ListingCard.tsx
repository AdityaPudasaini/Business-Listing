"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Phone, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "./RatingStars";
import { getCategoryLabel } from "@/data/categories";
import { theme } from "@/config/theme";
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

  return (
    <div className="group h-full">
      <Card
        noPadding
        style={{
          ["--card-shadow" as string]: `${theme.colors.primary}4D`,
        }}
        className={`overflow-hidden h-full flex flex-col transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_16px_32px_-12px_var(--card-shadow)] ${
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

        <div
          onClick={openListing}
          className="p-5 flex flex-col flex-1 cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-lg text-gray-900 truncate min-w-0">
              {business.name}
            </h4>

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
            onClick={(e) => e.stopPropagation()}
            aria-label={`Open ${business.name} on Google Maps`}
            className="mt-3 flex items-center gap-2 text-base text-gray-600 hover:text-[var(--pin-hover)] transition-colors w-fit"
            style={{
              ["--pin-hover" as string]: theme.colors.primary,
            }}
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
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-base text-gray-600 hover:text-gray-900"
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
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 text-base text-gray-600 hover:text-gray-900"
                  >
                    <MessageCircle size={20} className="shrink-0" />
                    {business.whatsapp}
                  </a>
                )}
              </div>

              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
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
