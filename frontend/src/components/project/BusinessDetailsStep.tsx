// BusinessDetailsStep.tsx — Step 1 of the /register wizard: business name,
// description, category, and the two photo uploads. Files are only kept in
// local state/object URLs for preview — nothing is uploaded anywhere yet,
// since there's no storage/upload endpoint in the backend.
"use client";

import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { categories } from "@/data/categories";
import { theme } from "@/config/theme";
import { RegisterFormData } from "@/components/sections/RegisterPage";

interface BusinessDetailsStepProps {
  values: RegisterFormData;
  onChange: (patch: Partial<RegisterFormData>) => void;
  onNext: () => void;
}

// Every real, selectable category is a subCategory (e.g. "Auto Garage") —
// the top-level entries ("Auto") are just group headers in the filter UI,
// not something a business would register directly as.
const categoryOptions = categories.flatMap((cat) => cat.subCategories ?? []);

export function BusinessDetailsStep({
  values,
  onChange,
  onNext,
}: BusinessDetailsStepProps) {
  const businessPhotoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const businessPhotoUrl = values.businessPhoto
    ? URL.createObjectURL(values.businessPhoto)
    : null;

  function handleGalleryFiles(files: FileList | null) {
    if (!files) return;
    onChange({
      galleryPhotos: [...values.galleryPhotos, ...Array.from(files)],
    });
  }

  function removeGalleryPhoto(index: number) {
    onChange({
      galleryPhotos: values.galleryPhotos.filter((_, i) => i !== index),
    });
  }

  const canProceed =
    values.businessName.trim().length > 0 &&
    values.description.trim().length > 0 &&
    values.category.length > 0;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
        Business Details
      </h1>
      <p className="mt-1 text-gray-500">Tell us about your workshop</p>

      <div className="mt-8 space-y-6 max-w-xl">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">
            Business Name
          </label>
          <Input
            value={values.businessName}
            onChange={(e) => onChange({ businessName: e.target.value })}
            placeholder="Business Name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">
            Description
          </label>
          <textarea
            value={values.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="We are a......."
            required
            rows={3}
            style={{
              ["--hover-border" as string]: "#bdbdbd",
              ["--focus-border" as string]: theme.colors.primary,
              ["--focus-ring" as string]: theme.colors.primary,
            }}
            className="w-full rounded-xl border border-gray-300 px-5 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none resize-none transition-all duration-200 hover:border-[var(--hover-border)] focus:border-[var(--focus-border)] focus:ring-1 focus:ring-[var(--focus-ring)]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">
            Category
          </label>
          <select
            value={values.category}
            onChange={(e) => onChange({ category: e.target.value })}
            required
            style={{
              ["--hover-border" as string]: "#bdbdbd",
              ["--focus-border" as string]: theme.colors.primary,
              ["--focus-ring" as string]: theme.colors.primary,
            }}
            className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3.5 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-[var(--hover-border)] focus:border-[var(--focus-border)] focus:ring-1 focus:ring-[var(--focus-ring)]"
          >
            <option value="" disabled>
              Select one...
            </option>
            {categoryOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Business Photo — single */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              Business Photo
            </label>
            <input
              ref={businessPhotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                onChange({ businessPhoto: e.target.files?.[0] ?? null })
              }
            />
            <button
              type="button"
              onClick={() => businessPhotoInputRef.current?.click()}
              className="relative w-full aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center overflow-hidden"
            >
              {businessPhotoUrl ? (
                <img
                  src={businessPhotoUrl}
                  alt="Business preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Upload size={28} className="text-gray-400" />
              )}
            </button>
            <p className="mt-1.5 text-xs text-gray-400">
              Main image for your listing. Max 1MB.
            </p>
          </div>

          {/* Gallery Photos — multiple */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              Gallery Photo
            </label>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleGalleryFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center"
            >
              <Upload size={28} className="text-gray-400" />
            </button>
            <p className="mt-1.5 text-xs text-gray-400">
              Up to 10 photos of your workshop.
            </p>

            {values.galleryPhotos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {values.galleryPhotos.map((file, i) => (
                  <div
                    key={i}
                    className="relative h-14 w-14 rounded-lg overflow-hidden border border-gray-200"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryPhoto(i)}
                      aria-label="Remove photo"
                      className="absolute top-0.5 right-0.5 rounded-full bg-black/60 text-white p-0.5"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-end max-w-xl">
        <Button label="Next" onClick={onNext} disabled={!canProceed} />
      </div>
    </div>
  );
}
