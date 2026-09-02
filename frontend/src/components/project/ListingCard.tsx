// ListingCard.tsx
import { MapPin, Phone, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "./RatingStars";
import { getCategoryLabel } from "@/data/categories";
import { theme } from "@/config/theme";
import { Business } from "@/types";

interface ListingCardProps {
  business: Business;
  onClick?: () => void;
}

export function ListingCard({ business, onClick }: ListingCardProps) {
  const hasContact = business.phone || business.whatsapp;

  return (
    <Card
      noPadding
      className="group overflow-hidden h-full flex flex-col transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
    >
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

      <div className="border-t-2 border-gray-900" />

      <div
        onClick={onClick}
        className="p-5 flex flex-col flex-1 cursor-pointer"
      >
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
        {business.reviewCount !== undefined && (
          <p className="text-sm text-gray-400 -mt-0.5">
            {business.reviewCount} reviews
          </p>
        )}

        <a
          href={
            business.latitude !== undefined && business.longitude !== undefined
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
          style={{ ["--pin-hover" as string]: theme.colors.primary }}
        >
          <MapPin size={20} className="shrink-0" />
          {business.location}
          {business.distanceKm !== undefined && (
            <span className="text-gray-400">
              ·{" "}
              {business.distanceKm < 1
                ? `${Math.round(business.distanceKm * 1000)} m away`
                : `${business.distanceKm.toFixed(1)} km away`}
            </span>
          )}
        </a>

        {/* Contact lines (left) + Explore button (right) — the wireframe's
            two-column footer, replacing the old side-by-side Call/WhatsApp
            buttons. */}
        {hasContact && (
          <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between gap-3">
            <div className="flex flex-col gap-2">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-base text-gray-600 hover:text-gray-900"
                >
                  <Phone size={20} />
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
                  <MessageCircle size={20} />
                  {business.whatsapp}
                </a>
              )}
            </div>

            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <Button
                label="Explore"
                variant="secondary"
                className="rounded-xl text-base px-6 py-3"
                onClick={onClick}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
