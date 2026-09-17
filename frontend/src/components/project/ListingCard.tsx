"use client";

import { useLayoutEffect, useRef, useState } from "react";
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

const CARD_RADIUS_PX = 8;

export function ListingCard({ business, href }: ListingCardProps) {
  const hasContact = business.phone || business.whatsapp;
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setSize({
      width: rect.width,
      height: rect.height,
    });

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;

      setSize({
        width,
        height,
      });
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  function openListing() {
    if (isOpening) return;

    setIsOpening(true);

    setTimeout(() => {
      router.push(href);
    }, OPEN_ANIMATION_MS);
  }

  return (
    <div ref={wrapperRef} className="group relative h-full">
      {/* Animated card border */}
      {size.width > 0 && size.height > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 z-30 h-full w-full"
          viewBox={`0 0 ${size.width} ${size.height}`}
          aria-hidden="true"
        >
          <rect
            x="1"
            y="1"
            width={size.width - 2}
            height={size.height - 2}
            rx={CARD_RADIUS_PX}
            fill="none"
            stroke={theme.colors.primary}
            strokeWidth="4"
            strokeLinecap="round"
            pathLength={100}
            className="listing-card-trace"
          />
        </svg>
      )}

      {/* Card */}
      <Card
        noPadding
        style={{
          ["--card-shadow" as string]: `${theme.colors.primary}4D`,
        }}
        className={`overflow-hidden h-full flex flex-col transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_16px_32px_-12px_var(--card-shadow)] ${
          isOpening ? "scale-110 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {/* Image */}
        <div className="relative overflow-hidden">
          <img
            src={business.image}
            alt={business.name}
            className="w-full h-52 object-cover transition-transform duration-300 ease-out group-hover:scale-110"
          />

          <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-gray-800 shadow-sm">
            {getCategoryLabel(business.category)}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-gray-900" />

        {/* Card Content */}
        <div
          onClick={openListing}
          className="p-5 flex flex-col flex-1 cursor-pointer"
        >
          {/* Business Name + Rating */}
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-lg text-gray-900 truncate min-w-0">
              {business.name}
            </h4>

            <RatingStars
              rating={business.rating}
              readOnly
              className="text-xl shrink-0"
            />
          </div>

          {/* Review Count */}
          {business.reviewCount !== undefined && (
            <p className="text-sm text-gray-400 -mt-0.5">
              {business.reviewCount} reviews
            </p>
          )}

          {/* Location / Google Maps */}
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

          {/* Contact Information */}
          {hasContact && (
            <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between gap-3">
              <div className="flex flex-col gap-2">
                {/* Phone */}
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

                {/* WhatsApp */}
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

              {/* Explore Button */}
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

      {/* Running border animation */}
      <style jsx>{`
        .listing-card-trace {
          opacity: 0;
          stroke-dasharray: 8 92;
          transition: opacity 0.3s ease-out;
        }

        .group:hover .listing-card-trace {
          opacity: 1;
          animation: trace-run 4s linear infinite;
        }

        @keyframes trace-run {
          to {
            stroke-dashoffset: -100;
          }
        }
      `}</style>
    </div>
  );
}
