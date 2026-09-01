"use client";

import { CategoryFilter } from "@/components/project/CategoryFilter";

interface CategoriesProps {
  category?: string;
  onCategoryChange: (categoryId: string) => void;
}

export function Categories({ category, onCategoryChange }: CategoriesProps) {
  return (
    <section className="px-6 md:px-10 pt-8 pb-0">
      <CategoryFilter value={category} onChange={onCategoryChange} />

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          category ? "mt-4 max-h-20 opacity-100" : "mt-0 max-h-0 opacity-0"
        }`}
      >
        <div className="rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-800">
          {category && `Showing results for "${category}"`}
        </div>
      </div>
    </section>
  );
}
