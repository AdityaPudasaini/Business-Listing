"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  Clock3,
  Layers3,
  LoaderCircle,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";
import {
  addHeroImage,
  type AdminUser,
  approveListing,
  type AdminListing,
  adminUpdateListing,
  apiUpload,
  createCategory,
  deleteCategory,
  deleteHeroImage,
  deleteListing,
  getAdminCategories,
  getAdminHeroImages,
  getAdminListingDetail,
  getAdminListings,
  getAdminUsers,
  getSession,
  rejectListing,
  sendBroadcast,
  setListingPartnerStatus,
  updateCategory,
  updateUserRole,
  updateUserBanStatus,
} from "@/services/api";
import type { AdminCategory, HeroImage, OwnerListing } from "@/types";
import { CATEGORY_ICON_KEYS, resolveCategoryIcon } from "@/lib/categoryIcons";
import {
  ListingWizard,
  type RegisterFormData,
} from "@/components/sections/RegisterPage";
import { toRegisterFormData, toUpdatePayload } from "@/lib/listingForm";

type Filter = "all" | AdminListing["status"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
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

function StatusBadge({ status }: { status: AdminListing["status"] }) {
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

function useLiveListings() {
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
function PartnerToggle({
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
            listing.isPartner ? "bg-[#B11226]" : "bg-gray-300"
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
function DeleteListingButton({
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

function ListingCard({
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
            className="text-xs font-bold text-[#B11226] hover:opacity-70"
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
              className="text-sm font-bold text-[#B11226]"
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
                  <ListingCard
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
              <ListingCard
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

export function AdminReviewPage({ id }: { id: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminListingDetail(id)
      .then((listing) => {
        if (!cancelled) setFormData(toRegisterFormData(listing));
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load this listing.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      <PageHeader
        eyebrow="Review"
        title="Listing review"
        description="Review every submitted field before approving or rejecting this listing."
      />
      <div className="p-6 sm:p-8">
        {notice && (
          <div className="mb-6 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
            {notice}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading listing…</p>
        ) : !formData ? (
          <p className="text-sm text-red-600">
            {error || "Listing not found."}
          </p>
        ) : (
          <ListingWizard
            embedded
            initialValues={formData}
            adminActions={{
              onSave: async (values) => {
                await adminUpdateListing(id, await toUpdatePayload(values));
                setFormData(values);
                setNotice("Listing changes saved.");
              },
              onApprove: async (values) => {
                await adminUpdateListing(id, await toUpdatePayload(values));
                await approveListing(id);
                router.push("/admin/review");
              },
              onReject: async () => {
                if (!window.confirm("Reject this listing?")) return;
                await rejectListing(id);
                router.push("/admin/review");
              },
            }}
          />
        )}

        <button
          type="button"
          onClick={() => router.push("/admin/review")}
          className="mt-5 text-sm font-bold text-[#B11226]"
        >
          Back to review queue
        </button>
      </div>
    </>
  );
}

function useLiveUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    setLoading(true);
    setError("");
    return getAdminUsers()
      .then(setUsers)
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "Could not load users.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { users, loading, error, refresh };
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function UserRow({
  user,
  currentUserId,
  onChanged,
}: {
  user: AdminUser;
  currentUserId: string | null;
  onChanged: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState("");
  const [banPending, setBanPending] = useState(false);
  const [banFailed, setBanFailed] = useState("");
  const [confirmingBan, setConfirmingBan] = useState(false);
  const isSelf = currentUserId === user.id;

  async function toggleRole() {
    const nextRole = user.role === "admin" ? "user" : "admin";
    setPending(true);
    setFailed("");
    try {
      await updateUserRole(user.id, nextRole);
      await onChanged();
    } catch (reason) {
      setFailed(
        reason instanceof Error ? reason.message : "Could not update role.",
      );
    } finally {
      setPending(false);
    }
  }

  async function toggleBan() {
    const nextBanned = !user.isBanned;
    setBanPending(true);
    setBanFailed("");
    try {
      await updateUserBanStatus(user.id, nextBanned);
      await onChanged();
    } catch (reason) {
      setBanFailed(
        reason instanceof Error
          ? reason.message
          : "Could not update ban status.",
      );
    } finally {
      setBanPending(false);
      setConfirmingBan(false);
    }
  }

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold text-gray-900">
            {user.name || "Unnamed"}
          </p>
          <p className="mt-0.5 truncate text-sm text-gray-500">{user.email}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              user.role === "admin"
                ? "bg-[#B11226]/10 text-[#B11226]"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {user.role === "admin" ? "Admin" : "User"}
          </span>
          {user.isBanned && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
              Banned
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1 text-xs text-gray-500">
        {user.phone && <p>{user.phone}</p>}
        <p>
          {user.businessCount} listing{user.businessCount === 1 ? "" : "s"}
        </p>
        <p>Joined {formatShortDate(user.createdAt)}</p>
      </div>

      {failed && (
        <p className="mt-2 text-xs font-semibold text-red-600">{failed}</p>
      )}
      {banFailed && (
        <p className="mt-2 text-xs font-semibold text-red-600">{banFailed}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => void toggleRole()}
          disabled={pending || isSelf}
          title={isSelf ? "You can't change your own role" : undefined}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:opacity-70 disabled:opacity-40"
        >
          <ShieldCheck size={13} />
          {pending
            ? "Saving…"
            : user.role === "admin"
              ? "Remove admin access"
              : "Make admin"}
        </button>

        {user.isBanned || !confirmingBan ? (
          <button
            type="button"
            onClick={() =>
              user.isBanned ? void toggleBan() : setConfirmingBan(true)
            }
            disabled={banPending || isSelf}
            title={isSelf ? "You can't ban your own account" : undefined}
            className={`inline-flex items-center gap-1.5 text-xs font-bold hover:opacity-70 disabled:opacity-40 ${
              user.isBanned ? "text-gray-700" : "text-red-600"
            }`}
          >
            <Ban size={13} />
            {banPending ? "Saving…" : user.isBanned ? "Unban user" : "Ban user"}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              Ban &amp; unpublish their listings?
            </span>
            <button
              type="button"
              disabled={banPending}
              onClick={() => void toggleBan()}
              className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50"
            >
              {banPending ? "Banning…" : "Yes, ban"}
            </button>
            <button
              type="button"
              disabled={banPending}
              onClick={() => setConfirmingBan(false)}
              className="text-xs font-bold text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

// BroadcastModal — site-wide email compose, admin-only. Sends to every user
// in the system (not scoped to a business) via POST /admin/broadcasts.
function BroadcastModal({
  totalUsers,
  onClose,
}: {
  totalUsers: number;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const response = await sendBroadcast({
        subject: subject.trim(),
        message: message.trim(),
      });
      setResult({ sent: response.sent, failed: response.failed });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't send the broadcast.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <p className="flex items-center gap-2 font-bold text-gray-900">
            <Mail size={16} />
            Email all users
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {result ? (
          <div className="px-5 py-8 text-center">
            {result.failed === 0 ? (
              <p className="text-sm font-bold text-green-600">
                Sent to {result.sent} user{result.sent === 1 ? "" : "s"}.
              </p>
            ) : (
              <p className="text-sm font-bold text-amber-600">
                Sent to {result.sent} of {result.sent + result.failed} —{" "}
                {result.failed} failed to send. Check the backend logs for the
                reason.
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:border-gray-300"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4 px-5 py-4">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {error}
              </p>
            )}
            <p className="text-xs text-gray-500">
              This goes to every user with an account —{" "}
              <span className="font-bold text-gray-700">
                {totalUsers} recipient{totalUsers === 1 ? "" : "s"}
              </span>
              .
            </p>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Subject
              </label>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="e.g. New categories are now live"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Message
              </label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                placeholder="Write your announcement…"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <button
              type="button"
              onClick={() => void submit()}
              disabled={!subject.trim() || !message.trim() || sending}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#B11226] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              <Send size={14} />
              {sending
                ? "Sending…"
                : `Send to ${totalUsers} user${totalUsers === 1 ? "" : "s"}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const { users, loading, error, refresh } = useLiveUsers();
  const [search, setSearch] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSession().then((session) => {
      if (!cancelled) setCurrentUserId(session?.userId ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.name, user.email, user.phone]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search, users]);

  return (
    <>
      <PageHeader
        eyebrow="Users"
        title="User management"
        description="Everyone with an account — promote trusted owners to admin, or step one back."
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
              placeholder="Search users…"
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-bold"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setBroadcastOpen(true)}
            disabled={loading || users.length === 0}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Mail size={15} />
            Email all users
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <p className="text-sm text-gray-500">Loading users…</p>
          ) : (
            visible.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                currentUserId={currentUserId}
                onChanged={refresh}
              />
            ))
          )}
          {!loading && !visible.length && (
            <p className="text-sm text-gray-500">No users match this search.</p>
          )}
        </div>
      </div>

      {broadcastOpen && (
        <BroadcastModal
          totalUsers={users.length}
          onClose={() => setBroadcastOpen(false)}
        />
      )}
    </>
  );
}

function HeroImageCard({
  image,
  onDeleted,
}: {
  image: HeroImage;
  onDeleted: () => Promise<void>;
}) {
  // Same two-step inline confirm as DeleteListingButton above, instead of
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
        title="Homepage hero images"
        description="Photos shown in rotation at the top of the homepage. Add a few wide, high-contrast photos for the best result."
      />
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#B11226] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
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
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

function useLiveCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    setLoading(true);
    setError("");
    return getAdminCategories()
      .then(setCategories)
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not load categories.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { categories, loading, error, refresh };
}

function CategoryIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const Preview = resolveCategoryIcon(value);
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600">
        {Preview ? <Preview size={16} /> : <span className="text-xs">—</span>}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">No icon</option>
        {CATEGORY_ICON_KEYS.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
    </div>
  );
}

// Shared by both the "add category" form and each row's inline edit —
// same fields either way, just different submit behavior.
function CategoryForm({
  initialLabel = "",
  initialIcon = "",
  submitLabel,
  onCancel,
  onSubmit,
}: {
  initialLabel?: string;
  initialIcon?: string;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (values: { label: string; icon: string }) => Promise<void>;
}) {
  const [label, setLabel] = useState(initialLabel);
  const [icon, setIcon] = useState(initialIcon);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!label.trim()) {
      setError("Label is required.");
      return;
    }
    setPending(true);
    setError("");
    try {
      await onSubmit({ label: label.trim(), icon });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save this category.",
      );
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4"
    >
      <div>
        <label className="mb-1 block text-xs font-bold text-gray-600">
          Label
        </label>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="e.g. Auto Garage"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold text-gray-600">
          Icon (only shown for sub-categories on the public site)
        </label>
        <CategoryIconPicker value={icon} onChange={setIcon} />
      </div>

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#B11226] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="text-xs font-bold text-gray-500 hover:text-gray-800"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function CategoryDeleteButton({
  category,
  onChanged,
}: {
  category: AdminCategory;
  onChanged: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setPending(true);
    setError("");
    try {
      await deleteCategory(category.id);
      await onChanged();
    } catch (reason) {
      // The backend blocks this with a message naming exactly how many
      // listings/products are still on it — surface that verbatim rather
      // than a generic "couldn't delete".
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not delete this category.",
      );
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
    <div className="flex flex-wrap items-center gap-2">
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
          setError("");
        }}
        className="text-xs font-bold text-gray-500 hover:text-gray-800"
      >
        Cancel
      </button>
      {error && (
        <p className="w-full text-xs font-semibold text-red-600">{error}</p>
      )}
    </div>
  );
}

function CategoryRow({
  category,
  indent,
  onChanged,
}: {
  category: AdminCategory;
  indent: boolean;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const Icon = resolveCategoryIcon(category.icon);

  if (editing) {
    return (
      <div className={indent ? "ml-6" : undefined}>
        <CategoryForm
          initialLabel={category.label}
          initialIcon={category.icon ?? ""}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={async ({ label, icon }) => {
            await updateCategory(category.id, {
              label,
              icon: icon || undefined,
            });
            setEditing(false);
            await onChanged();
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm ${
        indent ? "ml-6" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
          {Icon ? <Icon size={16} /> : <Layers3 size={16} />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">
            {category.label}
          </p>
          <p className="truncate text-xs text-gray-400">{category.id}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800"
        >
          <Pencil size={13} />
          Edit
        </button>
        <CategoryDeleteButton category={category} onChanged={onChanged} />
      </div>
    </div>
  );
}

export function AdminCategoriesPage() {
  const { categories, loading, error, refresh } = useLiveCategories();
  const [addingUnder, setAddingUnder] = useState<string | null | "none">(
    "none",
  );

  const topLevel = categories.filter((item) => !item.parentId);
  const childrenOf = (id: string) =>
    categories.filter((item) => item.parentId === id);

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Categories"
        description="Manage the categories businesses can register under. A category's id is locked once created — editing only changes its label and icon, since existing listings are matched against that id directly."
      />
      <div className="space-y-6 p-6 sm:p-8">
        {error && <p className="text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="text-sm text-gray-500">Loading categories…</p>
        ) : (
          <div className="space-y-4">
            {topLevel.map((parent) => (
              <div key={parent.id} className="space-y-2">
                <CategoryRow
                  category={parent}
                  indent={false}
                  onChanged={refresh}
                />
                {childrenOf(parent.id).map((child) => (
                  <CategoryRow
                    key={child.id}
                    category={child}
                    indent
                    onChanged={refresh}
                  />
                ))}

                {addingUnder === parent.id ? (
                  <div className="ml-6">
                    <CategoryForm
                      submitLabel="Add sub-category"
                      onCancel={() => setAddingUnder("none")}
                      onSubmit={async ({ label, icon }) => {
                        await createCategory({
                          label,
                          icon: icon || undefined,
                          parentId: parent.id,
                        });
                        setAddingUnder("none");
                        await refresh();
                      }}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingUnder(parent.id)}
                    className="ml-6 inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800"
                  >
                    <Plus size={13} />
                    Add sub-category
                  </button>
                )}
              </div>
            ))}

            {!topLevel.length && (
              <p className="text-sm text-gray-500">
                No categories yet — add the first top-level category below.
              </p>
            )}
          </div>
        )}

        {addingUnder === null ? (
          <CategoryForm
            submitLabel="Add category"
            onCancel={() => setAddingUnder("none")}
            onSubmit={async ({ label, icon }) => {
              await createCategory({ label, icon: icon || undefined });
              setAddingUnder("none");
              await refresh();
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingUnder(null)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#B11226] px-4 py-2.5 text-sm font-bold text-white"
          >
            <Plus size={15} />
            Add top-level category
          </button>
        )}
      </div>
    </>
  );
}
