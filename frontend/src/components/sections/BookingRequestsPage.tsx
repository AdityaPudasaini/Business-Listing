"use client";

// BookingRequestsPage — owner side of bookings. Lists bookings customers made
// on businesses this user owns (GET /bookings/received) and lets the owner
// confirm or decline them (PATCH /bookings/:id/status).
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";
import { theme } from "@/config/theme";
import { getReceivedBookings, updateBookingStatus } from "@/services/api";
import { useDemoAuthStore } from "@/features/auth/useDemoAuthStore";
import type { MyBooking } from "@/types";
import { BookingCard } from "@/components/sections/BookingCard";

type RequestFilter = "all" | "pending" | "confirmed" | "closed";

function matchesFilter(booking: MyBooking, filter: RequestFilter) {
  if (filter === "all") return true;
  if (filter === "closed") {
    return booking.status === "declined" || booking.status === "cancelled";
  }
  return booking.status === filter;
}

function RequestActions({
  booking,
  onChanged,
}: {
  booking: MyBooking;
  onChanged: () => Promise<void>;
}) {
  const [pending, setPending] = useState<"confirmed" | "declined" | null>(null);
  const [error, setError] = useState("");

  async function set(status: "confirmed" | "declined") {
    setPending(status);
    setError("");
    try {
      await updateBookingStatus(booking.id, status);
      await onChanged();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Couldn't update this booking.",
      );
    } finally {
      setPending(null);
    }
  }

  // Cancelled by the customer, or already declined: nothing left to do.
  if (booking.status === "cancelled" || booking.status === "declined") {
    return null;
  }

  return (
    <>
      {error && (
        <span className="mr-auto text-xs font-semibold text-red-600">
          {error}
        </span>
      )}
      <button
        type="button"
        disabled={pending !== null}
        onClick={() => void set("declined")}
        className="rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-bold text-gray-700 hover:border-red-300 hover:text-red-600 disabled:opacity-50"
      >
        {pending === "declined" ? "Declining…" : "Decline"}
      </button>
      {booking.status === "pending" && (
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void set("confirmed")}
          style={{ backgroundColor: theme.colors.primary }}
          className="rounded-lg px-3.5 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending === "confirmed" ? "Confirming…" : "Confirm"}
        </button>
      )}
    </>
  );
}

export function BookingRequestsPage() {
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<RequestFilter>("pending");
  const [search, setSearch] = useState("");
  // Re-fetch whenever the signed-in account changes, not just on mount —
  // see ChatLogsPage.tsx for the same fix and why it's needed.
  const userId = useDemoAuthStore((s) => s.user?.id);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return getReceivedBookings()
      .then(setBookings)
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not load booking requests.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setBookings([]);
    void load();
  }, [load, userId]);

  const tabs: { id: RequestFilter; label: string }[] = [
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "closed", label: "Declined / cancelled" },
    { id: "all", label: "All" },
  ];

  const counts = useMemo(() => {
    const result = {} as Record<RequestFilter, number>;
    for (const tab of tabs) {
      result[tab.id] = bookings.filter((item) =>
        matchesFilter(item, tab.id),
      ).length;
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings.filter(
      (item) =>
        matchesFilter(item, filter) &&
        (!query ||
          [
            item.business.name,
            item.service,
            item.contactName,
            item.contactPhone,
            item.contactEmail,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query)),
    );
  }, [bookings, filter, search]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={15} />
          Back to dashboard
        </Link>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-400">
          My dashboard
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-gray-950 sm:text-4xl">
          My bookings
        </h1>
        <p className="mt-2 text-gray-500">
          Bookings customers have made on your listings. Confirm or decline them
          here — the customer is emailed and sees the new status.
        </p>

        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  style={
                    active
                      ? {
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary,
                        }
                      : undefined
                  }
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                    active
                      ? "text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  <span
                    className={
                      active ? "ml-1.5 opacity-80" : "ml-1.5 text-gray-400"
                    }
                  >
                    {counts[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>
          <label className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by customer, business or service…"
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {loading ? (
            <p className="text-sm text-gray-500">Loading bookings…</p>
          ) : (
            visible.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                actions={<RequestActions booking={booking} onChanged={load} />}
              />
            ))
          )}
        </div>

        {!loading && !error && visible.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="font-bold text-gray-900">
              {bookings.length === 0
                ? "No bookings yet"
                : "Nothing in this tab"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {bookings.length === 0
                ? "When customers book one of your listings, it will show up here."
                : "Try another tab or search term."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
