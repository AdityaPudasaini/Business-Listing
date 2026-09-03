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
      <Categories category={category} onCategoryChange={setCategory} />
      <NearbyListings
        location={address}
        category={category}
        lat={coords?.lat}
        lng={coords?.lng}
      />
      <TrustedPartners category={category} />
      <FeaturedBrands />
      <HowItWorks />
      <OwnABusiness />
      <CategoryShowcase onCategorySelect={setCategory} />
    </>
  );
}
