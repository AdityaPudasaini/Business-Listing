// Hero.tsx — the big banner section at the top of the homepage. Copy this pattern for any other homepage section (About, Gallery, Reviews, etc).
"use client";

import { useEffect, useState } from "react";
import { MapPin, Search, Plus } from "lucide-react";
import { theme } from "@/config/theme";
import { Button } from "@/components/ui/Button";
import { heroImages } from "@/data/heroImages";

interface HeroProps {
  address: string;
  onAddressChange: (address: string) => void;
}

export function Hero({ address, onAddressChange }: HeroProps) {
  const [slide, setSlide] = useState(0);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  function handleSearch() {
    const params = new URLSearchParams();
    if (address) params.set("address", address);
    window.location.href = `/listings?${params.toString()}`;
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation isn't supported by your browser");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
          );
          const data = await res.json();
          const a = data.address ?? {};

          // Pick the most specific place name available (city > town > village > suburb),
          // then pair it with the country — short and readable, instead of the full
          // house-number-to-postcode string Nominatim returns by default.
          const place = a.city || a.town || a.village || a.suburb || a.county;
          const shortAddress = [place, a.country].filter(Boolean).join(", ");

          onAddressChange(
            shortAddress || data.display_name || `${latitude}, ${longitude}`,
          );
        } catch {
          // Reverse-geocode failed — fall back to raw coordinates rather than nothing.
          onAddressChange(`${latitude}, ${longitude}`);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        alert(
          "Couldn't get your location. Please enable location permissions.",
        );
      },
    );
  }

  return (
    <section className="relative overflow-hidden px-4 sm:px-6 min-h-[78vh] flex flex-col items-center justify-center text-center">
      <div className="absolute inset-0 -z-10">
        {heroImages.map((src, i) => (
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
        Trusted reviews from your neighbors
      </p>
      <h1 className="mt-2 text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
        Discover The best
      </h1>
      <p className="mt-4 text-base sm:text-lg text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.85)]">
        Find the right Service for and near you.
      </p>

      <div className="mt-8 max-w-2xl md:translate-x-10 mx-auto flex flex-col sm:flex-row gap-2 w-full">
        <div
          style={{ ["--focus-ring" as string]: theme.colors.primary }}
          className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3 bg-white/90 shadow-lg transition-colors duration-200 hover:border-gray-400 focus-within:border-[var(--focus-ring)] focus-within:ring-1 focus-within:ring-[var(--focus-ring)]"
        >
          <input
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Enter your Address"
            className="w-full py-3 text-sm outline-none bg-transparent"
          />
          <span
            onClick={handleUseMyLocation}
            className="flex items-center gap-1 text-sm text-gray-500 border-l-2 border-gray-400 pl-3 cursor-pointer hover:text-gray-700 select-none"
          >
            <MapPin size={16} className={locating ? "animate-pulse" : ""} />
            {locating ? "Locating..." : "Location"}
          </span>
        </div>
        <Button
          label="Search"
          icon={<Search size={16} />}
          className="justify-center"
          onClick={handleSearch}
        />
      </div>

      <div className="mt-6">
        <Button
          label="Add Listing"
          icon={<Plus size={16} />}
          variant="primary"
          className="px-8 sm:px-14 !transition-all duration-700 ease-in-out hover:scale-[1.03] hover:shadow-lg"
          onClick={() => (window.location.href = "/register")}
        />
      </div>

      {heroImages.length > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {heroImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              aria-label={`Show slide ${i + 1}`}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === slide ? "20px" : "8px",
                backgroundColor: i === slide ? theme.colors.primary : "#d1d5db",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
