// BookingCard — one booking as a card. Used by the owner's "My bookings"
// page (BookingRequestsPage), which passes its Confirm/Decline buttons in via
// `actions`. The status/date helpers live here too.
import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, Mail, Phone, User } from "lucide-react";
import type { MyBooking } from "@/types";

export const STATUS_STYLES: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Confirmed", className: "bg-green-50 text-green-700" },
  declined: { label: "Declined", className: "bg-red-50 text-red-700" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-600" },
};

export function statusStyle(status: string) {
  return (
    STATUS_STYLES[status] ?? {
      label: status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : "Pending",
      className: "bg-gray-100 text-gray-600",
    }
  );
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

// "14:30" -> "2:30 PM". Falls back to the raw string for anything unexpected.
export function formatTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${match[2]} ${suffix}`;
}

export function isUpcoming(booking: MyBooking) {
  const date = new Date(booking.date);
  if (Number.isNaN(date.getTime())) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return date >= startOfToday;
}

function labelize(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

// Shared with the owner-side "Booking requests" page, which passes its own
// confirm/decline buttons through `actions`.
export function BookingCard({
  booking,
  actions,
}: {
  booking: MyBooking;
  actions?: ReactNode;
}) {
  const style = statusStyle(booking.status);
  const details = Object.entries(booking.details ?? {}).filter(
    ([, value]) => value !== "" && value !== null && value !== undefined,
  );

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {booking.business.slug ? (
            <Link
              href={`/listings/${booking.business.slug}`}
              className="block truncate text-lg font-bold text-gray-900 hover:opacity-70"
            >
              {booking.business.name || "Business"}
            </Link>
          ) : (
            <p className="truncate text-lg font-bold text-gray-900">
              {booking.business.name || "Business"}
            </p>
          )}
          {booking.service && (
            <p className="mt-0.5 text-sm text-gray-500">{booking.service}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${style.className}`}
        >
          {style.label}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-600">
        <p className="flex items-center gap-1.5">
          <CalendarDays size={15} className="text-gray-400" />
          {formatDate(booking.date)}
        </p>
        <p className="flex items-center gap-1.5">
          <Clock3 size={15} className="text-gray-400" />
          {formatTime(booking.time)}
        </p>
      </div>

      {(booking.contactName ||
        booking.contactPhone ||
        booking.contactEmail) && (
        <div className="mt-4 space-y-1 border-t border-gray-100 pt-4 text-xs text-gray-500">
          {booking.contactName && (
            <p className="flex items-center gap-1.5">
              <User size={13} />
              {booking.contactName}
            </p>
          )}
          {booking.contactPhone && (
            <p className="flex items-center gap-1.5">
              <Phone size={13} />
              {booking.contactPhone}
            </p>
          )}
          {booking.contactEmail && (
            <p className="flex items-center gap-1.5">
              <Mail size={13} />
              {booking.contactEmail}
            </p>
          )}
        </div>
      )}

      {details.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gray-100 pt-4 text-xs">
          {details.map(([key, value]) => (
            <div key={key} className="min-w-0">
              <dt className="font-semibold text-gray-400">{labelize(key)}</dt>
              <dd className="truncate text-gray-700">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}

      {actions && (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-4">
          {actions}
        </div>
      )}
    </article>
  );
}
