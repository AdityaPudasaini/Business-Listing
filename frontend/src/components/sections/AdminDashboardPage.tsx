"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  ListChecks,
  Search,
  User,
  XCircle,
} from "lucide-react";
import { ListingWizard } from "@/components/sections/RegisterPage";
import { useSubmissionsStore } from "@/features/admin/useSubmissionsStore";
import { AdminSubmission } from "@/types";

type ListingFilter = "all" | "pending" | "published" | "rejected";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function StatusBadge({ listing }: { listing: AdminSubmission }) {
  if (listing.status === "rejected") {
    return (
      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
        Rejected
      </span>
    );
  }

  if (listing.status === "published" && listing.hasChanges) {
    return (
      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
        Changes pending
      </span>
    );
  }

  if (listing.status === "published") {
    return (
      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
        Published
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
      Pending
    </span>
  );
}

export function AdminDashboardPage() {
  const submissions = useSubmissionsStore((state) => state.submissions);
  const update = useSubmissionsStore((state) => state.update);
  const approve = useSubmissionsStore((state) => state.approve);
  const reject = useSubmissionsStore((state) => state.reject);

  const [activeFilter, setActiveFilter] = useState<ListingFilter>("pending");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const totalCount = submissions.length;

  const pendingCount = submissions.filter(
    (listing) => listing.status === "pending",
  ).length;

  const publishedCount = submissions.filter(
    (listing) => listing.status === "published",
  ).length;

  const rejectedCount = submissions.filter(
    (listing) => listing.status === "rejected",
  ).length;

  const filteredSubmissions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return submissions.filter((listing) => {
      const matchesStatus =
        activeFilter === "all" || listing.status === activeFilter;

      const searchableText = [
        listing.formData.businessName,
        listing.formData.category,
        listing.formData.localAddress,
        listing.submittedBy,
        listing.phone,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [activeFilter, search, submissions]);

  useEffect(() => {
    if (
      selectedId &&
      !filteredSubmissions.some((listing) => listing.id === selectedId)
    ) {
      setSelectedId(null);
    }
  }, [filteredSubmissions, selectedId]);

  const selected =
    submissions.find((listing) => listing.id === selectedId) ?? null;

  function selectFilter(filter: ListingFilter) {
    setActiveFilter(filter);
    setSearch("");
    setSelectedId(null);
    setNotice("");
  }

  function rejectSelectedListing() {
    if (!selected) return;

    const confirmed = window.confirm(
      `Reject "${selected.formData.businessName}"?`,
    );

    if (!confirmed) return;

    reject(selected.id);
    setNotice("Listing rejected.");
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Administration
        </p>

        <h1 className="mt-1 text-3xl font-extrabold text-gray-950 sm:text-4xl">
          Listing review dashboard
        </h1>

        <p className="mt-2 text-gray-500">
          Review business submissions, correct their details, then approve or
          reject them.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() => selectFilter("all")}
            className={`flex items-center gap-4 rounded-xl border p-5 text-left shadow-sm transition hover:shadow-md ${
              activeFilter === "all"
                ? "border-gray-900 bg-gray-100"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <ListChecks size={20} />
            </span>
            <span>
              <span className="block text-2xl font-extrabold text-gray-950">
                {totalCount}
              </span>
              <span className="block text-sm text-gray-500">All listings</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => selectFilter("pending")}
            className={`flex items-center gap-4 rounded-xl border p-5 text-left shadow-sm transition hover:shadow-md ${
              activeFilter === "pending"
                ? "border-amber-400 bg-amber-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock3 size={20} />
            </span>
            <span>
              <span className="block text-2xl font-extrabold text-gray-950">
                {pendingCount}
              </span>
              <span className="block text-sm text-gray-500">Pending</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => selectFilter("published")}
            className={`flex items-center gap-4 rounded-xl border p-5 text-left shadow-sm transition hover:shadow-md ${
              activeFilter === "published"
                ? "border-green-400 bg-green-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-green-700">
              <CheckCircle2 size={20} />
            </span>
            <span>
              <span className="block text-2xl font-extrabold text-gray-950">
                {publishedCount}
              </span>
              <span className="block text-sm text-gray-500">Published</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => selectFilter("rejected")}
            className={`flex items-center gap-4 rounded-xl border p-5 text-left shadow-sm transition hover:shadow-md ${
              activeFilter === "rejected"
                ? "border-red-400 bg-red-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-700">
              <XCircle size={20} />
            </span>
            <span>
              <span className="block text-2xl font-extrabold text-gray-950">
                {rejectedCount}
              </span>
              <span className="block text-sm text-gray-500">Rejected</span>
            </span>
          </button>
        </div>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {activeFilter === "all"
                  ? "All listings"
                  : `${activeFilter.charAt(0).toUpperCase()}${activeFilter.slice(1)} listings`}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredSubmissions.length} listing
                {filteredSubmissions.length === 1 ? "" : "s"} found
              </p>
            </div>

            <label className="relative block w-full sm:w-72">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, category, owner..."
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {filteredSubmissions.length > 0 ? (
              filteredSubmissions.map((listing) => {
                const isSelected = listing.id === selectedId;

                return (
                  <button
                    key={listing.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(listing.id);
                      setNotice("");
                    }}
                    className={`rounded-xl border p-4 text-left shadow-sm transition hover:shadow-md ${
                      isSelected
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-gray-900">
                          {listing.formData.businessName}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {listing.formData.category}
                        </p>
                      </div>

                      <StatusBadge listing={listing} />
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-gray-500">
                      <p className="flex items-center gap-1.5">
                        <User size={13} />
                        {listing.submittedBy}
                      </p>

                      <p className="flex items-center gap-1.5">
                        <Clock3 size={13} />
                        Submitted {formatDate(listing.submittedAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="col-span-full rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
                <p className="font-semibold text-gray-700">No listings found</p>
                <p className="mt-1 text-sm text-gray-500">
                  Try another status or a different search term.
                </p>
              </div>
            )}
          </div>
        </section>

        {notice && (
          <div className="mt-6 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
            {notice}
          </div>
        )}

        <section className="mt-6">
          {selected ? (
            <div key={selected.id} className="animate-listing-open">
              <ListingWizard
                embedded
                initialValues={selected.formData}
                adminActions={{
                  onSave: (values) => {
                    update(selected.id, values);
                    setNotice("Listing changes saved.");
                  },

                  onApprove: (values) => {
                    update(selected.id, values);
                    approve(selected.id);
                    setNotice("Listing approved and published.");
                  },

                  onReject: rejectSelectedListing,
                }}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500 shadow-sm">
              Select a listing above to start reviewing it.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
