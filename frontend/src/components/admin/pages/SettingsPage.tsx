"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import {
  addHeroImage,
  apiUpload,
  deleteHeroImage,
  deletePopupAd,
  getAdminHeroImages,
  getPopupAd,
  savePopupAd,
} from "@/services/api";
import type { HeroImage, PopupAd } from "@/types";
import {
  DeleteListingButton,
  PageHeader,
} from "@/components/admin/shared";

function HeroImageCard({
  image,
  onDeleted,
}: {
  image: HeroImage;
  onDeleted: () => Promise<void>;
}) {
  // Same two-step inline confirm as DeleteListingButton (shared.tsx), instead of
  // window.confirm() — keeps the confirmation in the app's own styling
  // rather than the browser's native "localhost:3000 says" popup.
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await deleteHeroImage(image.id);
      await onDeleted();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not remove this image.",
      );
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="relative h-40 w-full">
        <Image
          src={image.url}
          alt="Homepage hero image"
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover"
        />
      </div>

      {confirming ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-3 text-center">
          <p className="text-sm font-semibold text-white">Remove this image?</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={() => void handleDelete()}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {deleting ? "Removing…" : "Yes, remove"}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirming(false)}
              className="rounded-md bg-white px-3 py-1.5 text-xs font-bold text-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label="Remove hero image"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition hover:bg-white"
        >
          <Trash2 size={15} />
        </button>
      )}

      {error && (
        <p className="absolute inset-x-0 bottom-0 bg-red-600/90 px-2 py-1 text-center text-xs font-semibold text-white">
          {error}
        </p>
      )}
    </div>
  );
}

function PopupAdSection() {
  const [ad, setAd] = useState<PopupAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [href, setHref] = useState("");
  const [confirming, setConfirming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void getPopupAd()
      .then((result) => {
        setAd(result);
        setHref(result?.href ?? "");
      })
      .catch((reason) => {
        setError(
          reason instanceof Error ? reason.message : "Could not load the popup ad.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  // One wrapper so every action gets the same busy / error / success handling.
  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(success);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    await run(async () => {
      const url = await apiUpload(file);
      const saved = await savePopupAd({ image: url });
      setAd(saved);
      setHref(saved?.href ?? "");
    }, "Popup image updated.");
  }

  const linkChanged = ad !== null && href.trim() !== ad.href;

  return (
    <section className="mt-10 border-t border-gray-200 pt-8">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-extrabold text-gray-950">Entry popup ad</h2>
        {ad && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              ad.active
                ? "bg-green-50 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {ad.active ? "Showing" : "Hidden"}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500">
        The ad visitors see when they open the homepage. With no image uploaded,
        the built-in default ad is shown.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Loading popup ad…</p>
      ) : (
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
            <Image
              src={ad?.image ?? "/popup-ad.png"}
              alt={ad?.alt ?? "Default popup ad"}
              width={1042}
              height={676}
              className="block h-auto w-full"
            />
            {!ad && (
              <p className="px-1 pt-2 text-xs text-gray-500">
                Built-in default (no custom ad yet)
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {busy ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Plus size={15} />
                )}
                {ad ? "Replace image" : "Upload ad image"}
              </button>

              {ad && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(
                      async () => {
                        setAd(await savePopupAd({ active: !ad.active }));
                      },
                      ad.active ? "Popup hidden." : "Popup is showing.",
                    )
                  }
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 disabled:opacity-60"
                >
                  {ad.active ? "Hide popup" : "Show popup"}
                </button>
              )}

              {ad &&
                (confirming ? (
                  <span className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm">
                    <span className="font-semibold text-red-700">
                      Remove and use default?
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await deletePopupAd();
                          setAd(null);
                          setHref("");
                          setConfirming(false);
                        }, "Custom ad removed. The default is showing again.")
                      }
                      className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      className="rounded-md bg-white px-2.5 py-1 text-xs font-bold text-gray-800"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirming(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 disabled:opacity-60"
                  >
                    <Trash2 size={15} /> Remove
                  </button>
                ))}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleFileChange(event)}
            />

            <div>
              <label
                htmlFor="popup-ad-href"
                className="text-sm font-bold text-gray-800"
              >
                Link when clicked (optional)
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="popup-ad-href"
                  type="url"
                  value={href}
                  disabled={!ad || busy}
                  onChange={(event) => setHref(event.target.value)}
                  placeholder={
                    ad ? "https://example.com/offer" : "Upload an image first"
                  }
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
                />
                <button
                  type="button"
                  disabled={!linkChanged || busy}
                  onClick={() =>
                    void run(async () => {
                      setAd(await savePopupAd({ href: href.trim() }));
                    }, "Link saved.")
                  }
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 disabled:opacity-50"
                >
                  Save link
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must start with http:// or https://. Leave empty for a
                non-clickable ad.
              </p>
            </div>

            {notice && <p className="text-sm text-green-700">{notice}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>
      )}
    </section>
  );
}

export function AdminSettingsPage() {
  const [images, setImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError("");
    return getAdminHeroImages()
      .then(setImages)
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not load hero images.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets picking the same file twice fire onChange again
    if (!file) return;

    setUploading(true);
    setUploadError("");
    try {
      const url = await apiUpload(file);
      await addHeroImage(url);
      await refresh();
    } catch (reason) {
      setUploadError(
        reason instanceof Error
          ? reason.message
          : "Could not upload this image.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Homepage settings"
        description="Hero photos shown in rotation at the top of the homepage, and the popup ad visitors see when they arrive."
      />
      <div className="p-6 sm:p-8">
        <h2 className="mb-4 text-xl font-extrabold text-gray-950">
          Hero images
        </h2>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {uploading ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            {uploading ? "Uploading…" : "Add hero image"}
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700"
          >
            Refresh
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void handleFileChange(event)}
        />

        {uploadError && (
          <p className="mt-3 text-sm text-red-600">{uploadError}</p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="text-sm text-gray-500">Loading hero images…</p>
          ) : (
            images.map((image) => (
              <HeroImageCard key={image.id} image={image} onDeleted={refresh} />
            ))
          )}
          {!loading && !images.length && (
            <p className="text-sm text-gray-500">
              No hero images configured yet — the homepage is showing its
              built-in default photos instead.
            </p>
          )}
        </div>

        <PopupAdSection />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */
