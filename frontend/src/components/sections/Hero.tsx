// Hero.tsx — the big banner section at the top of the homepage. Copy this pattern for any other homepage section (About, Gallery, Reviews, etc).
"use client";

import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AddressAutocomplete } from "@/components/project/AddressAutocomplete";
import { heroImages as staticHeroImages } from "@/data/heroImages";
import { getHeroImages } from "@/services/api";
import { getActiveVertical } from "@/features/verticals";

interface Coords {
  lat: number;
  lng: number;
}

interface HeroProps {
  address: string;
  onAddressChange: (address: string) => void;
  coords: Coords | undefined;
  onCoordsChange: (coords: Coords | undefined) => void;
}

export function Hero({
  address,
  onAddressChange,
  coords,
  onCoordsChange,
}: HeroProps) {
  const vertical = getActiveVertical();
  const [slide, setSlide] = useState(0);
  // Start with the static defaults so there's never a blank/empty hero on
  // first paint, then swap in admin-managed photos if any are configured —
  // same fallback pattern getHeroImages() itself documents.
  const [images, setImages] = useState<string[]>(staticHeroImages);

  useEffect(() => {
    let cancelled = false;
    getHeroImages().then((fetched) => {
      if (!cancelled && fetched.length) {
        setImages(fetched.map((image) => image.url));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % images.length);
    }, 5000);
    return () => clearInterval(id);
  }, [images.length]);

  function handleSearch(e?: { preventDefault: () => void }) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (address) params.set("address", address);
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    }
    window.location.href = `/listings?${params.toString()}`;
  }

  return (
    <section className="relative overflow-hidden px-4 sm:px-6 min-h-[78vh] flex flex-col items-center justify-center text-center">
      <div className="absolute inset-0 -z-10">
        {images.map((src, i) => (
          <div
            key={src}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              i === slide ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <p className="text-sm sm:text-base text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.85)]">
        {vertical.labels.heroEyebrow}
      </p>
      <h1 className="mt-2 text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
        {vertical.labels.heroHeading}
      </h1>
      <p className="mt-4 text-base sm:text-lg text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.85)]">
        {vertical.labels.heroDescription}
      </p>

      <form
        onSubmit={handleSearch}
        className="mt-8 max-w-2xl md:translate-x-10 mx-auto flex flex-col sm:flex-row gap-2 w-full"
      >
        <AddressAutocomplete
          value={address}
          onValueChange={onAddressChange}
          onCoordsChange={onCoordsChange}
        />
        <Button
          label="Search"
          icon={<Search size={16} />}
          type="submit"
          className="justify-center"
        />
      </form>

      <div className="mt-6">
        <Button
          label={vertical.labels.addListing}
          icon={<Plus size={16} />}
          variant="primary"
          className="px-8 sm:px-14 !transition-all duration-700 ease-in-out hover:scale-[1.03] hover:shadow-lg"
          onClick={() => (window.location.href = "/register")}
        />
      </div>

      {images.length > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              aria-label={`Show slide ${i + 1}`}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === slide ? "20px" : "8px",
                backgroundColor: i === slide ? "#B11226" : "#d1d5db",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
