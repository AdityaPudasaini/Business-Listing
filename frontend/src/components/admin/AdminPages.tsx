"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Layers3,
  Search,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { ListingWizard } from "@/components/sections/RegisterPage";
import { useSubmissionsStore } from "@/features/admin/useSubmissionsStore";
import type { AdminSubmission } from "@/types";

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

function PageHeader({
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

function MetricCard({
  icon,
  label,
  value,
  href,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  href: string;
  tone: "gray" | "amber" | "green" | "red";
}) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <Link
      href={href}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        {icon}
      </span>

      <p className="mt-5 text-3xl font-extrabold text-gray-950">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </Link>
  );
}

export function AdminOverviewPage() {
  const submissions = useSubmissionsStore((state) => state.submissions);

  const pending = submissions.filter(
    (listing) => listing.status === "pending",
  ).length;

  const published = submissions.filter(
    (listing) => listing.status === "published",
  ).length;

  const rejected = submissions.filter(
    (listing) => listing.status === "rejected",
  ).length;

  const recentPending = submissions
    .filter((listing) => listing.status === "pending")
    .slice(0, 4);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Admin overview"
        description="A clear snapshot of your business-listing moderation."
      />

      <div className="p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Layers3 size={20} />}
            label="All listings"
            value={submissions.length}
            href="/admin/listings"
            tone="gray"
          />

          <MetricCard
            icon={<Clock3 size={20} />}
            label="Pending review"
            value={pending}
            href="/admin/listings"
            tone="amber"
          />

          <MetricCard
            icon={<CheckCircle2 size={20} />}
            label="Published"
            value={published}
            href="/admin/listings"
            tone="green"
          />

          <MetricCard
            icon={<XCircle size={20} />}
            label="Rejected"
            value={rejected}
            href="/admin/listings"
            tone="red"
          />
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-gray-900">Pending review queue</h2>
              <p className="mt-1 text-sm text-gray-500">
                Listings waiting for an admin decision.
              </p>
            </div>

            <Link
              href="/admin/listings"
              className="text-sm font-bold text-[#B11226] hover:opacity-70"
            >
              View listings
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {recentPending.length > 0 ? (
              recentPending.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/admin/review/${listing.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50"
                >
                  <div>
                    <p className="font-bold text-gray-900">
                      {listing.formData.businessName}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {listing.submittedBy} · {formatDate(listing.submittedAt)}
                    </p>
                  </div>

                  <ChevronRight size={18} className="text-gray-400" />
                </Link>
              ))
            ) : (
              <p className="px-5 py-10 text-center text-sm text-gray-500">
                Nothing is waiting for review.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export function AdminListingsPage({
  reviewOnly = false,
}: {
  reviewOnly?: boolean;
}) {
  const submissions = useSubmissionsStore((state) => state.submissions);

  const [filter, setFilter] = useState<ListingFilter>(
    reviewOnly ? "pending" : "all",
  );

  const [search, setSearch] = useState("");

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return submissions.filter((listing) => {
      const matchesFilter = filter === "all" || listing.status === filter;

      const searchText = [
        listing.formData.businessName,
        listing.formData.category,
        listing.formData.localAddress,
        listing.submittedBy,
        listing.phone,
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!query || searchText.includes(query));
    });
  }, [filter, search, submissions]);

  const filters: { id: ListingFilter; label: string }[] = reviewOnly
    ? [{ id: "pending", label: "Pending" }]
    : [
        { id: "all", label: "All" },
        { id: "pending", label: "Pending" },
        { id: "published", label: "Published" },
        { id: "rejected", label: "Rejected" },
      ];

  return (
    <>
      <PageHeader
        eyebrow="Listings"
        title="All listings"
        description="Search, filter, and review every business registered on the platform."
      />

      <div className="p-6 sm:p-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    filter === item.id
                      ? "bg-[#B11226] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
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
                placeholder="Search listings..."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-gray-400"
              />
            </label>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-gray-100">
            {filteredListings.length > 0 ? (
              filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex flex-col gap-4 border-b border-gray-100 bg-white p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-gray-900">
                        {listing.formData.businessName}
                      </p>

                      <StatusBadge listing={listing} />
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {listing.formData.category} ·{" "}
                      {listing.formData.localAddress}
                    </p>

                    <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                      <User size={13} />
                      {listing.submittedBy} · Submitted{" "}
                      {formatDate(listing.submittedAt)}
                    </p>
                  </div>

                  <Link
                    href={`/admin/review/${listing.id}`}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    {listing.status === "pending" ? "Review" : "View details"}
                    <ChevronRight size={16} />
                  </Link>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-sm text-gray-500">
                No listings match this filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function AdminReviewPage({ id }: { id: string }) {
  const router = useRouter();

  const submissions = useSubmissionsStore((state) => state.submissions);
  const update = useSubmissionsStore((state) => state.update);
  const approve = useSubmissionsStore((state) => state.approve);
  const reject = useSubmissionsStore((state) => state.reject);

  const selected = submissions.find((listing) => listing.id === id);

  if (!selected) {
    return (
      <>
        <PageHeader
          eyebrow="Review"
          title="Listing not found"
          description="This listing may have been removed."
        />

        <div className="p-6 sm:p-8">
          <Link
            href="/admin/listings"
            className="inline-flex rounded-xl bg-[#B11226] px-4 py-2.5 text-sm font-bold text-white"
          >
            Back to listings
          </Link>
        </div>
      </>
    );
  }

  const listing = selected;

  function rejectListing() {
    const confirmed = window.confirm(
      `Reject "${listing.formData.businessName}"?`,
    );

    if (!confirmed) return;

    reject(listing.id);
    router.push("/admin/listings");
  }

  return (
    <>
      <PageHeader
        eyebrow="Review listing"
        title={listing.formData.businessName}
        description="Check and correct the original registration form before approving or rejecting it."
      />

      <div className="p-6 sm:p-8">
        <Link
          href="/admin/listings"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#B11226] hover:opacity-70"
        >
          ← Back to listings
        </Link>

        <div key={listing.id} className="animate-listing-open">
          <ListingWizard
            embedded
            initialValues={listing.formData}
            adminActions={{
              onSave: (values) => {
                update(listing.id, values);
              },

              onApprove: (values) => {
                update(listing.id, values);
                approve(listing.id);
                router.push("/admin/listings");
              },

              onReject: rejectListing,
            }}
          />
        </div>
      </div>
    </>
  );
}

export function AdminUsersPage() {
  const submissions = useSubmissionsStore((state) => state.submissions);

  const users = useMemo(() => {
    const grouped = new Map<
      string,
      {
        name: string;
        email: string;
        phone: string;
        listingCount: number;
        publishedCount: number;
        pendingCount: number;
      }
    >();

    submissions.forEach((listing) => {
      const existing = grouped.get(listing.submittedBy);

      if (existing) {
        existing.listingCount += 1;

        if (listing.status === "published") {
          existing.publishedCount += 1;
        }

        if (listing.status === "pending") {
          existing.pendingCount += 1;
        }

        return;
      }

      grouped.set(listing.submittedBy, {
        name: listing.submittedBy,
        email: listing.formData.email || "Not provided",
        phone: listing.formData.phone || "Not provided",
        listingCount: 1,
        publishedCount: listing.status === "published" ? 1 : 0,
        pendingCount: listing.status === "pending" ? 1 : 0,
      });
    });

    return Array.from(grouped.values());
  }, [submissions]);

  return (
    <>
      <PageHeader
        eyebrow="Users"
        title="Business owners"
        description="Every account that has submitted one or more listings."
      />

      <div className="p-6 sm:p-8">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
              <Users size={19} />
            </span>

            <div>
              <h2 className="font-bold text-gray-900">All users</h2>
              <p className="text-sm text-gray-500">
                {users.length} users found
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {users.map((user) => (
              <div
                key={user.name}
                className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
              >
                <div>
                  <p className="font-bold text-gray-900">{user.name}</p>
                  <p className="mt-1 text-sm text-gray-500">{user.email}</p>
                  <p className="mt-1 text-sm text-gray-500">{user.phone}</p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Listings
                  </p>
                  <p className="mt-1 text-lg font-extrabold text-gray-900">
                    {user.listingCount}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                    Status
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-700">
                    {user.publishedCount} published · {user.pendingCount}{" "}
                    pending
                  </p>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <p className="p-12 text-center text-sm text-gray-500">
                No users have submitted listings yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
