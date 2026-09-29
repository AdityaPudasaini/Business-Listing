"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Filter,
  AdminListingCard,
  PageHeader,
  useLiveListings,
} from "@/components/admin/shared";

export function AdminListingsPage({
  reviewOnly = false,
}: {
  reviewOnly?: boolean;
}) {
  const { listings, loading, error, refresh } = useLiveListings();
  const [filter, setFilter] = useState<Filter>(reviewOnly ? "pending" : "all");
  const [search, setSearch] = useState("");
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return listings.filter(
      (item) =>
        (filter === "all" || item.status === filter) &&
        (!query ||
          [
            item.name,
            item.category,
            item.location,
            item.ownerName,
            item.ownerEmail,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)),
    );
  }, [filter, listings, search]);
  return (
    <>
      <PageHeader
        eyebrow={reviewOnly ? "Review queue" : "Listings"}
        title={reviewOnly ? "Review queue" : "All listings"}
        description="Live listings from the database."
      />
      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search listings…"
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm"
            />
          </label>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as Filter)}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Published</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-bold"
          >
            Refresh
          </button>
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {loading ? (
            <p className="text-sm text-gray-500">Loading listings…</p>
          ) : (
            visible.map((listing) => (
              <AdminListingCard
                key={listing.id}
                listing={listing}
                onChanged={refresh}
              />
            ))
          )}
          {!loading && !visible.length && (
            <p className="text-sm text-gray-500">
              No listings match this filter.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
