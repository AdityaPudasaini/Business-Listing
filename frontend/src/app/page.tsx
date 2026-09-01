// page.tsx — the homepage. Add your homepage sections here, one component per section (see PART C of the guideline docx for the exact section order).
"use client";

import { useState } from "react";
import { Hero } from "@/components/sections/Hero";
import { Categories } from "@/components/sections/Categories";
import { NearbyListings } from "@/components/sections/NearbyListings";
import { TrustedPartners } from "@/components/sections/TrustedPartners";

export default function HomePage() {
  const [category, setCategory] = useState<string>();
  const [address, setAddress] = useState("");

  return (
    <>
      <Hero address={address} onAddressChange={setAddress} />
      <Categories category={category} onCategoryChange={setCategory} />
      <NearbyListings location={address} category={category} />
      <TrustedPartners />
      {/* TODO: add the rest of the homepage sections listed in the guideline docx,
          in order — pass `category`/`address` into each one so they all filter together. */}
    </>
  );
}
