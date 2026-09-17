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

interface Coords {
  lat: number;
  lng: number;
}

export default function HomePage() {
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
        />
      </ScrollReveal>

      <ScrollReveal>
        <TrustedPartners category={category} />
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
        <CategoryShowcase onCategorySelect={setCategory} />
      </ScrollReveal>
    </>
  );
}
