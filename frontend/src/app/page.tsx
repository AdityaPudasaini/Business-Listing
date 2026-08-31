// page.tsx — the homepage. Add your homepage sections here, one component per section (see PART C of the guideline docx for the exact section order).
"use client";

import { useState } from "react";
import { Hero } from "@/components/sections/Hero";
import { Categories } from "@/components/sections/Categories";

export default function HomePage() {
  const [category, setCategory] = useState<string>();

  return (
    <>
      <Hero />
      <Categories category={category} onCategoryChange={setCategory} />
      {/* TODO: add the rest of the homepage sections listed in the guideline docx,
          in order — pass `category` into each one so they all filter together. */}
    </>
  );
}
