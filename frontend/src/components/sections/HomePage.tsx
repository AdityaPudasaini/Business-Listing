// HomePage.tsx — the interactive part of the homepage. app/page.tsx fetches
// the initial data on the server and passes it in, so search engines get real
// listings in the HTML; the shared filter state below still lives client-side.
"use client";

import { useState } from "react";
import { Hero } from "@/components/sections/Hero";
import { Categories } from "@/components/sections/Categories";
import { NearbyListings } from "@/components/sections/NearbyListings";
import { TrustedPartners } from "@/components/sections/TrustedPartners";
import { FeaturedBrands } from "@/components/sections/FeaturedBrands";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { OwnABusiness } from "@/components/sections/OwnABusiness";
import { CategoryShowcase } from "@/components/sections/Categoryshowcase";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import type { Business } from "@/types";

interface Coords {
  lat: number;
  lng: number;
}

// Each field is undefined when the server fetch failed; the section then
// falls back to fetching in the browser.
export interface HomePageProps {
  initialListings?: Business[];
  initialHeroImages?: string[];
}

export function HomePage({
  initialListings,
  initialHeroImages,
}: HomePageProps) {
  const [category, setCategory] = useState<string>();
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<Coords>();

  return (
    <>
      <Hero
        address={address}
        onAddressChange={setAddress}
        coords={coords}
        onCoordsChange={setCoords}
        initialImages={initialHeroImages}
      />

      <ScrollReveal>
        <Categories category={category} onCategoryChange={setCategory} />
      </ScrollReveal>

      <ScrollReveal>
        <NearbyListings
          location={address}
          category={category}
          lat={coords?.lat}
          lng={coords?.lng}
          initialListings={initialListings}
        />
      </ScrollReveal>

      <ScrollReveal>
        <TrustedPartners
          category={category}
          initialBusinesses={initialListings}
        />
      </ScrollReveal>

      <ScrollReveal>
        <FeaturedBrands />
      </ScrollReveal>

      <ScrollReveal>
        <HowItWorks />
      </ScrollReveal>

      <ScrollReveal>
        <OwnABusiness />
      </ScrollReveal>

      <ScrollReveal>
        <CategoryShowcase
          onCategorySelect={setCategory}
          initialListings={initialListings}
        />
      </ScrollReveal>
    </>
  );
}
