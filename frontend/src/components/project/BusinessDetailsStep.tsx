"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import NextImage from "next/image";
import { useFormContext } from "react-hook-form";
import { Upload, Images, Image as ImageIcon, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { theme } from "@/config/theme";
import type { RegisterFormData } from "@/components/sections/RegisterPage";
import { getActiveVertical } from "@/features/verticals";
import { getCategories } from "@/services/api";
import type { Category } from "@/types";

interface BusinessDetailsStepProps {
  values: RegisterFormData;
  onChange: (patch: Partial<RegisterFormData>) => void;
  onNext: () => void;
  navButtons: ReactNode;
}

// Was a static import from @/data/categories — now pulled live so a
// category added/renamed/removed in the admin panel shows up here with no
// code change. Falls back to an empty list on failure rather than crashing
// the registration form; the select just shows nothing to pick until a
// retry succeeds.
function useLiveCategoryOptions() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((result) => {
        if (!cancelled) setCategories(result);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return categories.flatMap((category) => category.subCategories ?? []);
}

function RequiredMark() {
  return (
    <span className="ml-0.5" style={{ color: theme.colors.primary }}>
      *
    </span>
  );
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }

  return undefined;
}

export function BusinessDetailsStep({
  values,
  onChange,
  navButtons,
}: BusinessDetailsStepProps) {
  const vertical = getActiveVertical();
  const categoryOptions = useLiveCategoryOptions();

  const {
    formState: { errors },
  } = useFormContext<RegisterFormData>();

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const businessPhotoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const businessNameError = getErrorMessage(errors.businessName);
  const descriptionError = getErrorMessage(errors.description);
  const categoryError = getErrorMessage(errors.category);
  const bannerError = getErrorMessage(errors.bannerImage);
  const businessPhotoError = getErrorMessage(errors.businessPhoto);
  const galleryError = getErrorMessage(errors.galleryPhotos);

  const bannerUrl =
    typeof values.bannerImage === "string"
      ? values.bannerImage
      : values.bannerImage
        ? URL.createObjectURL(values.bannerImage)
        : null;

  const businessPhotoUrl =
    typeof values.businessPhoto === "string"
      ? values.businessPhoto
      : values.businessPhoto
        ? URL.createObjectURL(values.businessPhoto)
        : null;

  function handleGalleryFiles(files: FileList | null) {
    if (!files) return;

    const selectedFiles = Array.from(files);

    onChange({
      galleryPhotos: [...values.galleryPhotos, ...selectedFiles].slice(0, 10),
    });
  }

  function removeGalleryPhoto(index: number) {
    onChange({
      galleryPhotos: values.galleryPhotos.filter((_, photoIndex) => {
        return photoIndex !== index;
      }),
    });
  }

  return (
    <div>
      <div className="max-w-3xl space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900">
            {vertical.labels.registrationName}
            <RequiredMark />
          </label>

          <div
            className={
              businessNameError ? "rounded-xl ring-1 ring-red-500" : ""
            }
          >
            <Input
              value={values.businessName}
              onChange={(event) =>
                onChange({ businessName: event.target.value })
              }
              placeholder={vertical.labels.registrationNamePlaceholder}
              required
            />
          </div>

          {businessNameError && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {businessNameError}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900">
            Description
            <RequiredMark />
          </label>

          <textarea
            value={values.description}
            onChange={(event) => onChange({ description: event.target.value })}
            placeholder={vertical.labels.registrationDescriptionPlaceholder}
            rows={3}
            maxLength={1000}
            aria-invalid={Boolean(descriptionError)}
            style={{
              ["--hover-border" as string]: "#bdbdbd",
              ["--focus-border" as string]: theme.colors.primary,
              ["--focus-ring" as string]: theme.colors.primary,
            }}
            className={`w-full resize-none rounded-xl border px-5 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 hover:border-[var(--hover-border)] focus:border-[var(--focus-border)] focus:ring-1 focus:ring-[var(--focus-ring)] ${
              descriptionError ? "border-red-500" : "border-gray-300"
            }`}
          />

          <div className="mt-1.5 flex justify-between gap-3">
            <p className="text-xs text-gray-400">
              Describe your specialties, experience, and what makes you stand
              out.
            </p>

            <span className="shrink-0 text-xs text-gray-400">
              {values.description.length}/1000
            </span>
          </div>

          {descriptionError && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {descriptionError}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900">
            Category
            <RequiredMark />
          </label>

          <select
            value={values.category}
            onChange={(event) => onChange({ category: event.target.value })}
            aria-invalid={Boolean(categoryError)}
            style={{
              ["--hover-border" as string]: "#bdbdbd",
              ["--focus-border" as string]: theme.colors.primary,
              ["--focus-ring" as string]: theme.colors.primary,
            }}
            className={`w-full appearance-none rounded-xl border bg-white px-5 py-3.5 text-sm text-gray-900 outline-none transition-all duration-200 hover:border-[var(--hover-border)] focus:border-[var(--focus-border)] focus:ring-1 focus:ring-[var(--focus-ring)] ${
              categoryError ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="" disabled>
              {categoryOptions.length
                ? "Select a category"
                : "Loading categories…"}
            </option>

            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>

          {categoryError && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {categoryError}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900">
            Banner Image
          </label>

          <input
            ref={bannerInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              onChange({ bannerImage: event.target.files?.[0] ?? null });
              event.currentTarget.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            style={{
              ["--accent-tint" as string]: `${theme.colors.primary}14`,
            }}
            className={`relative flex aspect-[3/1] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed bg-gray-50 p-4 text-center transition-colors duration-200 hover:bg-gray-100 ${
              bannerError
                ? "border-red-400"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            {bannerUrl ? (
              <>
                <NextImage
                  src={bannerUrl}
                  alt="Banner preview"
                  fill
                  unoptimized
                  className="object-cover"
                />

                <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">
                  Change image
                </span>
              </>
            ) : (
              <>
                <span
                  style={{ color: theme.colors.primary }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-tint)]"
                >
                  <ImageIcon size={18} />
                </span>

                <span className="text-sm font-semibold text-gray-700">
                  Upload banner image
                </span>

                <span className="text-xs text-gray-400">PNG, JPG, or WebP</span>
              </>
            )}
          </button>

          {bannerUrl && (
            <button
              type="button"
              onClick={() => onChange({ bannerImage: null })}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
            >
              <X size={14} />
              Remove banner image
            </button>
          )}

          <p className="mt-1.5 text-xs text-gray-400">
            Wide cover photo shown at the top of your listing page. Maximum 5
            MB.
          </p>

          {bannerError && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {bannerError}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900">
              Business photo
            </label>

            <input
              ref={businessPhotoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                onChange({
                  businessPhoto: event.target.files?.[0] ?? null,
                });
                event.currentTarget.value = "";
              }}
            />

            <button
              type="button"
              onClick={() => businessPhotoInputRef.current?.click()}
              style={{
                ["--accent-tint" as string]: `${theme.colors.primary}14`,
              }}
              className={`relative flex aspect-square w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed bg-gray-50 p-4 text-center transition-colors duration-200 hover:bg-gray-100 ${
                businessPhotoError
                  ? "border-red-400"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {businessPhotoUrl ? (
                <>
                  <NextImage
                    src={businessPhotoUrl}
                    alt="Business preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />

                  <span className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">
                    Change image
                  </span>
                </>
              ) : (
                <>
                  <span
                    style={{ color: theme.colors.primary }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-tint)]"
                  >
                    <Upload size={18} />
                  </span>

                  <span className="text-sm font-semibold text-gray-700">
                    Upload business photo
                  </span>

                  <span className="text-xs text-gray-400">
                    PNG, JPG, or WebP
                  </span>
                </>
              )}
            </button>

            {businessPhotoUrl && (
              <button
                type="button"
                onClick={() => onChange({ businessPhoto: null })}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
              >
                <X size={14} />
                Remove business photo
              </button>
            )}

            <p className="mt-1.5 text-xs text-gray-400">
              Main image for your listing. Maximum 5 MB.
            </p>

            {businessPhotoError && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">
                {businessPhotoError}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900">
              Gallery images
            </label>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(event) => {
                handleGalleryFiles(event.target.files);
                event.currentTarget.value = "";
              }}
            />

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              style={{
                ["--accent-tint" as string]: `${theme.colors.primary}14`,
              }}
              className={`flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-gray-50 p-4 text-center transition-colors duration-200 hover:bg-gray-100 ${
                galleryError
                  ? "border-red-400"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <span
                style={{ color: theme.colors.primary }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-tint)]"
              >
                <Images size={18} />
              </span>

              <span className="text-sm font-semibold text-gray-700">
                Add gallery images
              </span>

              <span className="text-xs text-gray-400">PNG, JPG, or WebP</span>
            </button>

            <p className="mt-1.5 text-xs text-gray-400">
              Upload up to 10 photos of your business.
            </p>

            {galleryError && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">
                {galleryError}
              </p>
            )}

            {values.galleryPhotos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {values.galleryPhotos.map((photo, index) => {
                  const src =
                    typeof photo === "string"
                      ? photo
                      : URL.createObjectURL(photo);
                  return (
                    <div
                      key={
                        typeof photo === "string"
                          ? photo
                          : `${photo.name}-${index}`
                      }
                      className="relative h-14 w-14 overflow-hidden rounded-lg border border-gray-200"
                    >
                      <NextImage
                        src={src}
                        alt={`Gallery image ${index + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removeGalleryPhoto(index)}
                        aria-label={`Remove gallery image ${index + 1}`}
                        className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {navButtons}
    </div>
  );
}
