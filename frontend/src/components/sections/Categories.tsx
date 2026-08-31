"use client";

import { CategoryFilter } from "@/components/project/CategoryFilter";

interface CategoriesProps {
  category?: string;
  onCategoryChange: (categoryId: string) => void;
}

export function Categories({ category, onCategoryChange }: CategoriesProps) {
  return (
    <section className="px-6 md:px-10 py-16">
      <CategoryFilter value={category} onChange={onCategoryChange} />

      <div className="mt-4 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-800">
        {category ? `Showing results for "${category}"` : "Showing All Results"}
      </div>
    </section>
  );
}
