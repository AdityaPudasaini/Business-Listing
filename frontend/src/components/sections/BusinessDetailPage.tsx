// BusinessDetailPage.tsx — the individual listing page at /listings/[id].
// Reuses the same Google Maps JS setup pattern as ListingsMapSection.tsx
// (one marker, no interactivity needed beyond viewing/directions).

"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  ExternalLink,
  Info,
  Settings,
  Sparkles,
  Clock,
  CreditCard,
  ChevronRight,
  Wifi,
  Users,
  Wrench,
  Check,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BookingModal } from "@/components/project/BookingModal";
import { ReviewsSection } from "@/components/project/ReviewsSection";
import { FeaturedBrands } from "@/components/sections/FeaturedBrands";
import { getCategoryLabel } from "@/data/categories";
import { useGoogleMapsScript } from "@/hooks/useGoogleMapsScript";
import { theme } from "@/config/theme";
import { Business } from "@/types";

interface BusinessDetailPageProps {
  business: Business;
}

// Amenity icons are stored as string keys on Business (see types/index.ts)
// rather than live component references, since Business data is fetched
// server-side and passed into this Client Component as a prop — functions
// can't cross that boundary. Resolve the key to a real icon here instead.
const amenityIcons: Record<string, LucideIcon> = {
  wifi: Wifi,
  restroom: Users,
};

// Small local component — one expandable "Service Category" card. Kept in
// this file since it's only ever used here, not a general-purpose piece.
function ServiceCategoryCard({
  label,
  items,
}: {
  label: string;
  items?: string[];
}) {
  const [open, setOpen] = useState(false);
  const hasItems = !!items && items.length > 0;

  return (
    <div
      style={{
        ["--accent" as string]: theme.colors.primary,
        ["--accent-tint" as string]: `${theme.colors.primary}0D`, // ~5% tint
      }}
      className={`rounded-xl border p-5 transition-all duration-300 ease-out ${
        open
          ? "border-[var(--accent)] shadow-sm bg-white"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={!hasItems}
        className="w-full flex items-center gap-3 text-left disabled:cursor-default"
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ease-out ${
            open
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--accent-tint)] text-[var(--accent)]"
          }`}
        >
          <Wrench size={16} />
        </span>

        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-gray-900 truncate">
            {label}
          </span>
          {hasItems && (
            <span className="block text-xs text-gray-400">
              {items!.length} service{items!.length === 1 ? "" : "s"}
            </span>
          )}
        </span>

        {hasItems && (
          <ChevronRight
            size={18}
            className={`shrink-0 transition-transform duration-300 ease-out ${
              open ? "rotate-90 text-[var(--accent)]" : "text-gray-400"
            }`}
          />
        )}
      </button>

      {/* Grid-rows 0fr->1fr trick: animates height smoothly without a
          fixed max-height guess, and without an instant show/hide snap. */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          {hasItems && (
            <ul className="mt-4 pt-4 border-t border-gray-100 space-y-2.5">
              {items!.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-gray-600"
                >
                  <Check
                    size={14}
                    className="mt-0.5 shrink-0 text-[var(--accent)]"
                  />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function BusinessDetailPage({ business }: BusinessDetailPageProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const gallery = business.gallery ?? [business.image];

  const mapsLoaded = useGoogleMapsScript();
  const mapDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapsLoaded || !mapDivRef.current) return;

    if (business.latitude === undefined || business.longitude === undefined) {
      return;
    }

    const google = (window as any).google;

    const position = {
      lat: business.latitude,
      lng: business.longitude,
    };

    const map = new google.maps.Map(mapDivRef.current, {
      center: position,
      zoom: 15,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });

    new google.maps.Marker({
      position,
      map,
      title: business.name,
    });
  }, [mapsLoaded, business.latitude, business.longitude, business.name]);

  const directionsUrl =
    business.latitude !== undefined && business.longitude !== undefined
      ? `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          `${business.name}, ${business.location}`,
        )}`;

  return (
    <div className="pt-24 sm:pt-28 pb-16 px-4 sm:px-6 md:px-10">
      {/* Top banner */}

      <div
        className="relative overflow-hidden rounded-2xl rounded-b-none border border-b-0 border-gray-200 min-h-[440px] sm:min-h-[500px] md:min-h-[560px] flex items-end"
        style={{
          backgroundImage: `url(${business.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative p-6 sm:p-10 w-full">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
            {business.name}
          </h1>
          <p className="mt-1 text-gray-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
            {getCategoryLabel(business.category)}
          </p>
          <p className="mt-2 flex items-center gap-2 text-gray-100 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
            <MapPin size={18} />
            {business.location}
          </p>

          <div className="mt-6 flex flex-col gap-3 w-fit">
            <Button
              label="Booking Your Service"
              variant="primary"
              className="justify-center"
              onClick={() => setBookingOpen(true)}
            />
            <div className="flex gap-3">
              {business.phone && (
                <a href={`tel:${business.phone}`}>
                  <Button
                    label="Call"
                    icon={<Phone size={16} />}
                    variant="primary"
                  />
                </a>
              )}
              {business.whatsapp && (
                <a
                  href={`https://wa.me/${business.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    label="Whatsapp"
                    icon={<MessageCircle size={16} />}
                    variant="primary"
                  />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border rounded-b-2xl overflow-hidden border-gray-200 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
        <div className="p-4">
          <p className="text-sm font-semibold text-gray-900">Area</p>
          <p className="text-sm text-gray-500">{business.location}</p>
        </div>

        <div className="p-4">
          <p className="text-sm font-semibold text-gray-900">Hours</p>
          <p className="text-sm text-gray-500">{business.hours}</p>
        </div>

        <div className="p-4">
          <p className="text-sm font-semibold text-gray-900">Category</p>
          <p className="text-sm text-gray-500">
            {getCategoryLabel(business.category)}
          </p>
        </div>
      </div>

      {/* Gallery + sidebar */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        {/* Gallery */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Gallery</h2>
            <span className="text-sm text-gray-400">
              {activeImage + 1}/{gallery.length}
            </span>
          </div>

          <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden">
            <div className="relative h-[540px] w-full">
              {gallery.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={`${business.name} photo ${i + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
                    i === activeImage ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3 bg-gray-50 p-3">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  style={{
                    ["--active-border" as string]: theme.colors.primary,
                  }}
                  className={`shrink-0 h-16 w-24 sm:h-20 sm:w-28 rounded-lg overflow-hidden border-2 bg-white shadow-sm transition-colors ${
                    i === activeImage
                      ? "border-[var(--active-border)]"
                      : "border-transparent"
                  }`}
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* About Us */}
          {business.description && (
            <div className="mt-10">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <Info size={20} />
                About Us
              </h2>
              <div className="mt-3 rounded-xl bg-gray-50 p-5 space-y-4">
                {business.description.split("\n\n").map((para, i) => (
                  <p key={i} className="text-sm text-gray-600 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {business.services && business.services.length > 0 && (
            <div className="mt-10">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <Settings size={20} />
                Services
              </h2>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {business.services.map((service) => (
                  <ServiceCategoryCard
                    key={service.label}
                    label={service.label}
                    items={service.items}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {business.amenities && business.amenities.length > 0 && (
            <div className="mt-10">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <Sparkles size={20} />
                Amenities
              </h2>
              <div className="mt-3 flex flex-wrap gap-4">
                {business.amenities.map((amenity) => {
                  const AmenityIcon = amenityIcons[amenity.icon];
                  return (
                    <div
                      key={amenity.label}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700"
                    >
                      {AmenityIcon && (
                        <AmenityIcon size={18} className="text-gray-500" />
                      )}
                      {amenity.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
            <div className="mt-3">
              <ReviewsSection
                businessId={business.id}
                initialReviews={business.reviews}
              />
            </div>
          </div>
        </div>
        {/* Sidebar */}
        <div>
          {/* Invisible spacer matching the Gallery heading row above (h2 +
              image-count text) so Contact Info starts level with the
              actual photos, not the gallery column's heading. mb-3 matches
              the gallery's own mt-3 gap between its heading and photos —
              deliberately NOT using the space-y-6 below, which would
              overshoot that gap. */}
          <div
            aria-hidden="true"
            className="mb-3 flex items-center justify-between select-none opacity-0 pointer-events-none"
          >
            <h2 className="text-xl font-bold">Gallery</h2>
            <span className="text-sm">1/1</span>
          </div>

          <div className="space-y-6">
            {/* Contact Information */}

            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <p
                style={{ backgroundColor: theme.colors.primary }}
                className="px-4 py-3 font-semibold text-white"
              >
                Contact Information
              </p>

              <div className="divide-y divide-gray-100">
                {/* Location */}
                <div className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700">
                  <MapPin size={16} className="text-gray-400" />
                  {business.location}
                </div>

                {/* Phone */}
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Phone size={16} className="text-gray-400" />
                    {business.phone}
                  </a>
                )}

                {/* WhatsApp */}
                {business.whatsapp && (
                  <a
                    href={`https://wa.me/${business.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <MessageCircle size={16} className="text-gray-400" />
                    {business.whatsapp}
                  </a>
                )}

                {/* Email */}
                {business.email && (
                  <a
                    href={`mailto:${business.email}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Mail size={16} className="text-gray-400" />
                    {business.email}
                  </a>
                )}
              </div>
            </div>

            {/* Map */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <p
                style={{ backgroundColor: theme.colors.primary }}
                className="px-4 py-3 font-semibold text-white"
              >
                Map
              </p>

              <div className="h-[220px] bg-gray-100">
                {business.latitude !== undefined &&
                business.longitude !== undefined ? (
                  mapsLoaded ? (
                    <div ref={mapDivRef} className="h-full w-full" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
                      Loading map...
                    </div>
                  )
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm text-gray-400">
                    Location unavailable
                  </div>
                )}
              </div>

              {/* Get directions */}

              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-t border-gray-100"
              >
                Get directions
                <ExternalLink size={16} />
              </a>
            </div>

            {/* Opening Hours */}
            {business.hoursByDay && business.hoursByDay.length > 0 && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <p
                  style={{ backgroundColor: theme.colors.primary }}
                  className="flex items-center gap-2 px-4 py-3 font-semibold text-white"
                >
                  <Clock size={16} />
                  Opening Hours
                </p>
                <div className="divide-y divide-gray-100">
                  {business.hoursByDay.map((d) => (
                    <div
                      key={d.day}
                      className="flex items-center justify-between px-4 py-3 text-sm text-gray-700"
                    >
                      <span>{d.day}</span>
                      <span className="text-gray-500">{d.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments */}
            {business.paymentMethods && business.paymentMethods.length > 0 && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <p
                  style={{ backgroundColor: theme.colors.primary }}
                  className="flex items-center gap-2 px-4 py-3 font-semibold text-white"
                >
                  <CreditCard size={16} />
                  Payments
                </p>
                <div className="flex flex-wrap gap-2 p-4">
                  {business.paymentMethods.map((method) => (
                    <span
                      key={method}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Book a Service CTA */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-xs font-medium text-gray-400">
                Ready when you are!
              </p>
              <p className="mt-1 font-bold text-gray-900">Book a Service</p>
              <p className="mt-1 text-sm text-gray-500">
                Reserve a slot in a few clicks. No prepayment needed.
              </p>
              <Button
                label="Book"
                variant="primary"
                className="w-full justify-center mt-4"
                onClick={() => setBookingOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Brands — same section/component used on the homepage */}
      <div className="mt-14 -mx-4 sm:-mx-6 md:-mx-10">
        <FeaturedBrands />
      </div>

      {/* Booking Modal */}
      {bookingOpen && (
        <BookingModal
          business={business}
          onClose={() => setBookingOpen(false)}
        />
      )}
    </div>
  );
}
