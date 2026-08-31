// CategoryFilter.tsx
"use client";

import { useEffect, useState } from "react";
import { ArrowUpNarrowWide, ChevronDown, ChevronRight } from "lucide-react";
import { getCategories } from "@/services/api";
import { Category } from "@/types";

interface CategoryFilterProps {
  value?: string;
  onChange: (categoryId: string) => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (!open) setActiveCategoryId(null);
  }, [open]);

  const selectedLabel = (() => {
    for (const cat of categories) {
      if (cat.id === value) return cat.label;
      const sub = cat.subCategories?.find((s) => s.id === value);
      if (sub) return sub.label;
    }
    return null;
  })();

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 font-semibold text-gray-900 transition-colors duration-200 hover:bg-gray-200"
      >
        <ArrowUpNarrowWide size={18} />
        {selectedLabel ?? "Category"}
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          {/* click-outside catcher */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div className="absolute z-20 mt-2 w-64 max-w-[85vw] rounded-lg border bg-white py-1 shadow-lg">
            {categories.map((cat) => {
              const hasSubs =
                !cat.disabled && (cat.subCategories?.length ?? 0) > 0;
              const isActive = activeCategoryId === cat.id;

              return (
                <div key={cat.id} className="relative">
                  <button
                    type="button"
                    disabled={cat.disabled}
                    onClick={() => {
                      if (cat.disabled) return;
                      if (hasSubs) {
                        // toggle this category's flyout instead of selecting
                        // it directly, since it has its own subcategories
                        setActiveCategoryId(isActive ? null : cat.id);
                      } else {
                        onChange(cat.id);
                        setOpen(false);
                      }
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm font-semibold transition-colors duration-150 ${
                      cat.disabled
                        ? "cursor-not-allowed text-gray-300"
                        : isActive
                          ? "bg-gray-50 text-gray-800"
                          : "cursor-pointer text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <span>{cat.label}</span>
                    {cat.disabled ? (
                      <span className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-300">
                        Coming Soon
                      </span>
                    ) : (
                      hasSubs && (
                        <ChevronRight
                          size={14}
                          className={`text-gray-400 transition-transform duration-150 ${
                            isActive ? "rotate-90" : ""
                          }`}
                        />
                      )
                    )}
                  </button>
                  {hasSubs && (
                    <div
                      className={`absolute left-0 top-full sm:left-full sm:top-0 z-30 mt-1 sm:mt-0 sm:ml-2 w-full sm:w-56 max-w-[85vw] origin-top sm:origin-left rounded-lg border bg-white py-1 shadow-lg transition-all duration-150 ease-out ${
                        isActive
                          ? "translate-x-0 scale-100 opacity-100"
                          : "pointer-events-none -translate-x-1 scale-95 opacity-0"
                      }`}
                    >
                      <div className="px-4 py-2 text-sm font-bold text-gray-900">
                        {cat.label}
                      </div>
                      {cat.subCategories!.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            onChange(sub.id);
                            setOpen(false);
                          }}
                          className="block w-full cursor-pointer px-4 py-1.5 text-left text-sm text-gray-600 transition-colors duration-150 hover:bg-gray-50"
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
