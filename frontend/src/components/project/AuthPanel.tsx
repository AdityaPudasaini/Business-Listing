// AuthPanel.tsx — the left branded image panel on the login/signup pages.
// Reuses the same interval-based slideshow pattern as Hero.tsx, and the
// same heroImages so there's only one place to update background photos.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { theme } from "@/config/theme";
import { heroImages } from "@/data/heroImages";

const captions = [
  "Trusted Auto Care, All in One Place",
  "Find Verified Garages Near You",
  "Book Services in Minutes",
];

export function AuthPanel() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      {heroImages.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            i === slide ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/70" />

      <div className="relative h-full flex flex-col justify-between p-8">
        <div className="flex items-center justify-between">
          <span className="text-xl font-extrabold text-white">
            {theme.brandName}
          </span>
          <Link
            href="/"
            style={{ ["--hover" as string]: theme.colors.primary }}
            className="text-sm font-medium text-white bg-white/15 hover:bg-[var(--hover)] px-4 py-2 rounded-full transition-colors duration-200"
          >
            Back to website →
          </Link>
        </div>

        <div>
          <p className="text-2xl md:text-3xl font-bold text-white max-w-xs leading-snug">
            {captions[slide]}
          </p>
          <div className="mt-5 flex gap-1.5">
            {heroImages.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === slide ? "w-6 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
