// Hero.tsx — the big banner section at the top of the homepage. Copy this pattern for any other homepage section (About, Gallery, Reviews, etc).
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  // Admin-managed photos fetched on the server; undefined means that fetch
  // failed and the browser should try again.
  initialImages?: string[];
}

export function Hero({
  address,
  onAddressChange,
  coords,
  onCoordsChange,
  initialImages,
}: HeroProps) {
  const vertical = getActiveVertical();
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  // Fall back to the static defaults so there's never a blank/empty hero,
  // same pattern getHeroImages() itself documents.
  const [images, setImages] = useState<string[]>(
    initialImages?.length ? initialImages : staticHeroImages,
  );

  useEffect(() => {
    let cancelled = false;
    getHeroImages()
      .then((fetched) => {
        if (!cancelled && fetched.length) {
          setImages(fetched.map((image) => image.url));
        }
      })
      .catch(() => {
        // Keep the static images already on screen.
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
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <section className="relative overflow-hidden px-4 sm:px-6 min-h-[78vh] flex flex-col items-center justify-center text-center">
      <div className="absolute inset-0 -z-10">
        {images.map((src, i) => (
          // Real <img> tags (not CSS backgrounds) so the browser finds the
          // first image while parsing the HTML and fetches it right away.
          // Slides after the first load later, at low priority.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            fetchPriority={i === 0 ? "high" : "low"}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              i === slide ? "opacity-100" : "opacity-0"
            }`}
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
          onClick={() => router.push("/register")}
        />
      </div>

      {images.length > 1 && (
        <div className="mt-8 flex justify-center">
          {images.map((_, i) => (
            // The button is the 24px+ tap target; the span is the visible dot.
            <button
              key={i}
              type="button"
              onClick={() => setSlide(i)}
              aria-label={`Show slide ${i + 1}`}
              className="group flex items-center justify-center p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  i === slide ? "w-5 bg-primary" : "w-2 bg-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
