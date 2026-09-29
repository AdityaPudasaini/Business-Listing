"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Layers3, XCircle } from "lucide-react";
import {
  AdminListingCard,
  PageHeader,
  useLiveListings,
} from "@/components/admin/shared";

export function AdminOverviewPage() {
  const { listings, loading, error, refresh } = useLiveListings();
  const counts = useMemo(
    () => ({
      pending: listings.filter((item) => item.status === "pending").length,
      approved: listings.filter((item) => item.status === "approved").length,
      rejected: listings.filter((item) => item.status === "rejected").length,
    }),
    [listings],
  );
  const cards = [
    {
      label: "All listings",
      value: listings.length,
      href: "/admin/listings",
      icon: <Layers3 size={20} />,
    },
    {
      label: "Pending review",
      value: counts.pending,
      href: "/admin/review",
      icon: <Clock3 size={20} />,
    },
    {
      label: "Published",
      value: counts.approved,
      href: "/admin/listings",
      icon: <CheckCircle2 size={20} />,
    },
    {
      label: "Rejected",
      value: counts.rejected,
      href: "/admin/listings",
      icon: <XCircle size={20} />,
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Admin overview"
        description="Live moderation data from the business-listing API."
      />
      <div className="p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                {card.icon}
              </span>
              <p className="mt-5 text-3xl font-extrabold text-gray-950">
                {card.value}
              </p>
              <p className="mt-1 text-sm text-gray-500">{card.label}</p>
            </Link>
          ))}
        </div>
        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Pending review queue</h2>
              <p className="mt-1 text-sm text-gray-500">
                Approve or reject real submitted listings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-sm font-bold text-primary"
            >
              Refresh
            </button>
          </div>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {loading ? (
              <p className="text-sm text-gray-500">Loading listings…</p>
            ) : (
              listings
                .filter((item) => item.status === "pending")
                .slice(0, 4)
                .map((listing) => (
                  <AdminListingCard
                    key={listing.id}
                    listing={listing}
                    onChanged={refresh}
                  />
                ))
            )}
            {!loading &&
              !listings.some((item) => item.status === "pending") && (
                <p className="text-sm text-gray-500">
                  No listings are waiting for review.
                </p>
              )}
          </div>
        </section>
      </div>
    </>
  );
}
