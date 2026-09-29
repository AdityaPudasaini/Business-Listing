"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Clock3, MapPin, Trash2, User } from "lucide-react";
import {
  type AdminListing,
  deleteListing,
  getAdminListings,
  setListingPartnerStatus,
} from "@/services/api";
import { ListingWizard } from "@/components/sections/RegisterPage";

export type Filter = "all" | AdminListing["status"];

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-6 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
        Admin / {eyebrow}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold text-gray-950">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </header>
  );
}

export function StatusBadge({ status }: { status: AdminListing["status"] }) {
  const colors = {
    approved: "bg-green-50 text-green-700",
    pending: "bg-amber-50 text-amber-700",
    rejected: "bg-red-50 text-red-700",
  };
  const labels = {
    approved: "Published",
    pending: "Pending",
    rejected: "Rejected",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${colors[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function useLiveListings() {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    setLoading(true);
    setError("");
    return getAdminListings()
      .then(setListings)
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Could not load listings.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { listings, loading, error, refresh };
}

// Toggle for the "Trusted Partners" homepage carousel. Kept separate from
// the full edit form (ListingWizard) since it's a single field admins flip
// often and shouldn't need a whole review pass to change.
export function PartnerToggle({
  listing,
  onChanged,
}: {
  listing: AdminListing;
  onChanged: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function toggle() {
    setPending(true);
    setFailed(false);
    try {
      await setListingPartnerStatus(listing.id, !listing.isPartner);
      await onChanged();
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
      <span className="text-xs font-semibold text-gray-700">
        Trusted partner
      </span>
      <div className="flex items-center gap-2">
        {failed && (
          <span className="text-xs font-semibold text-red-600">
            Couldn&apos;t save
          </span>
        )}
        <button
          type="button"
          role="switch"
          aria-checked={listing.isPartner}
          aria-label="Toggle trusted partner status"
          disabled={pending}
          onClick={() => void toggle()}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out disabled:opacity-50 ${
            listing.isPartner ? "bg-primary" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
              listing.isPartner ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

// Two-step delete: the first click swaps the button for a confirm/cancel pair,
// because removing a listing also wipes its reviews, bookings and products.
export function DeleteListingButton({
  listing,
  onChanged,
}: {
  listing: AdminListing;
  onChanged: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function remove() {
    setPending(true);
    setFailed(false);
    try {
      await deleteListing(listing.id);
      await onChanged();
    } catch {
      setFailed(true);
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-600"
      >
        <Trash2 size={13} />
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {failed && (
        <span className="text-xs font-semibold text-red-600">
          Couldn&apos;t delete
        </span>
      )}
      <span className="text-xs text-gray-500">Delete permanently?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => void remove()}
        className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setConfirming(false);
          setFailed(false);
        }}
        className="text-xs font-bold text-gray-500 hover:text-gray-800"
      >
        Cancel
      </button>
    </div>
  );
}

export function AdminListingCard({
  listing,
  onChanged,
}: {
  listing: AdminListing;
  onChanged: () => Promise<void>;
}) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold text-gray-900">{listing.name}</p>
          <p className="mt-0.5 text-sm text-gray-500">{listing.category}</p>
        </div>
        <StatusBadge status={listing.status} />
      </div>
      <div className="mt-3 space-y-1 text-xs text-gray-500">
        <p className="flex items-center gap-1.5">
          <User size={13} />
          {listing.ownerName || listing.ownerEmail || "Owner unavailable"}
        </p>
        <p className="flex items-center gap-1.5">
          <MapPin size={13} />
          {listing.location}
        </p>
        <p className="flex items-center gap-1.5">
          <Clock3 size={13} />
          Submitted {formatDate(listing.createdAt)}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <Link
            href={`/admin/review/${listing.id}`}
            className="text-xs font-bold text-primary hover:opacity-70"
          >
            Open full review →
          </Link>
          <Link
            href={`/admin/listings/${listing.id}`}
            className="text-xs font-bold text-gray-500 hover:text-gray-800"
          >
            Customer activity →
          </Link>
        </div>
        <DeleteListingButton listing={listing} onChanged={onChanged} />
      </div>
      <PartnerToggle listing={listing} onChanged={onChanged} />
    </article>
  );
}
