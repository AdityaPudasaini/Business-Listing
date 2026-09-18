"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  ListChecks,
  MapPin,
  Search,
  X,
} from "lucide-react";
import {
  ListingWizard,
  RegisterFormData,
} from "@/components/sections/RegisterPage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { theme } from "@/config/theme";
import { DAYS_OF_WEEK } from "@/data/amenities";
import { getMyAccount, getMyListings } from "@/services/api";
import { OwnerAccount, OwnerListing } from "@/types";

type ListingFilter = "all" | "published" | "pending";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function toFormData(listing: OwnerListing): RegisterFormData {
  return {
    businessName: listing.name,
    description: "",
    category: listing.category,
    bannerImage: null,
    businessPhoto: null,
    galleryPhotos: [],
    localAddress: listing.location,
    mapAddress: listing.location,
    latitude: undefined,
    longitude: undefined,
    phone: listing.phone,
    whatsapp: "",
    email: "",
    website: "",
    services: listing.services,
    openingHours: DAYS_OF_WEEK.map((day) => ({
      day,
      open: "09:00",
      close: "18:00",
      closed: false,
    })),
    amenities: [],
    parkingAvailable: null,
    paymentMethods: [],
  };
}

function StatusBadge({ status }: { status: OwnerListing["status"] }) {
  return status === "published" ? (
    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
      Published
    </span>
  ) : (
    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
      Pending review
    </span>
  );
}

export function DashboardPage() {
  const [listings, setListings] = useState<OwnerListing[]>([]);
  const [account, setAccount] = useState<OwnerAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState<ListingFilter>("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    Promise.all([getMyListings(), getMyAccount()]).then(
      ([listingsResult, accountResult]) => {
        setListings(listingsResult);
        setAccount(accountResult);
        setLoading(false);
      },
    );
  }, []);

  const publishedCount = listings.filter(
    (listing) => listing.status === "published",
  ).length;

  const pendingCount = listings.filter(
    (listing) => listing.status === "pending",
  ).length;

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return listings.filter((listing) => {
      const matchesFilter =
        activeFilter === "all" || listing.status === activeFilter;

      const searchText = [
        listing.name,
        listing.category,
        listing.location,
        listing.phone,
        ...listing.services,
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!query || searchText.includes(query));
    });
  }, [activeFilter, listings, search]);

  const editingListing =
    listings.find((listing) => listing.id === editingId) ?? null;

  function chooseFilter(filter: ListingFilter) {
    setActiveFilter(filter);
    setSearch("");
    setEditingId(null);
  }

  function saveOwnerListing(values: RegisterFormData) {
    if (!editingListing) return;

    setListings((current) =>
      current.map((listing) =>
        listing.id === editingListing.id
          ? {
              ...listing,
              name: values.businessName,
              category: values.category,
              location: values.localAddress,
              phone: values.phone,
              services: values.services,
              // Owner changes should go back into review.
              status: "pending",
            }
          : listing,
      ),
    );

    setEditingId(null);
    setNotice("Your changes were saved and sent for review.");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-5xl">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
          My dashboard
        </p>

        <h1 className="mt-1 text-3xl font-extrabold text-gray-950 sm:text-4xl">
          Welcome, {account?.ownerName ?? "there"}
        </h1>

        <p className="mt-2 text-gray-500">
          Manage the listings registered under your account.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => chooseFilter("all")}
            className={`flex items-center gap-4 rounded-xl border p-5 text-left shadow-sm transition hover:shadow-md ${
              activeFilter === "all"
                ? "border-gray-900 bg-gray-100"
                : "border-gray-200 bg-white"
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <ListChecks size={20} />
            </span>
            <span>
              <span className="block text-2xl font-extrabold text-gray-950">
                {listings.length}
              </span>
              <span className="block text-sm text-gray-500">All listings</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => chooseFilter("published")}
            className={`flex items-center gap-4 rounded-xl border p-5 text-left shadow-sm transition hover:shadow-md ${
              activeFilter === "published"
                ? "border-green-400 bg-green-50"
                : "border-gray-200 bg-white"
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
            onClick={() => chooseFilter("pending")}
            className={`flex items-center gap-4 rounded-xl border p-5 text-left shadow-sm transition hover:shadow-md ${
              activeFilter === "pending"
                ? "border-amber-400 bg-amber-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <Clock3 size={20} />
            </span>
            <span>
              <span className="block text-2xl font-extrabold text-gray-950">
                {pendingCount}
              </span>
              <span className="block text-sm text-gray-500">
                Pending review
              </span>
            </span>
          </button>
        </div>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Your listings</h2>
              <p className="mt-1 text-sm text-gray-500">
                Click Edit listing to update one of your businesses.
              </p>
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <label className="relative flex-1 sm:w-64">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search your listings..."
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
              </label>

              <Link href="/register">
                <span
                  style={{
                    borderColor: theme.colors.primary,
                    color: theme.colors.primary,
                  }}
                  className="inline-flex items-center whitespace-nowrap rounded-lg border px-4 py-2.5 text-sm font-bold hover:bg-gray-50"
                >
                  + New listing
                </span>
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {filteredListings.length > 0 ? (
              filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-gray-900">
                        {listing.name}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {listing.category}
                      </p>
                    </div>

                    <StatusBadge status={listing.status} />
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    <p className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      {listing.location}
                    </p>

                    <p className="flex items-center gap-1.5">
                      <Clock3 size={13} />
                      Submitted {formatDate(listing.submittedAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(listing.id);
                      setNotice("");
                    }}
                    style={{ color: theme.colors.primary }}
                    className="mt-4 text-sm font-bold hover:opacity-70"
                  >
                    Edit listing →
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
                <p className="font-semibold text-gray-700">No listings found</p>
                <p className="mt-1 text-sm text-gray-500">
                  Try another filter or search term.
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

        {editingListing && (
          <section
            key={editingListing.id}
            className="animate-listing-open mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-md sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Edit listing
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-gray-950">
                  {editingListing.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close edit form"
              >
                <X size={18} />
              </button>
            </div>

            <ListingWizard
              embedded
              initialValues={toFormData(editingListing)}
              ownerActions={{
                onSave: saveOwnerListing,
              }}
            />
          </section>
        )}
      </div>
    </main>
  );
}
