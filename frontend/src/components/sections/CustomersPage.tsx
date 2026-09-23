"use client";

// CustomersPage — one place to see everyone who booked, reviewed, or

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  Mail,
  MessageCircle,
  MessagesSquare,
  Search,
  Send,
  Star,
  X,
} from "lucide-react";
import { theme } from "@/config/theme";
import { getBusinessCustomers, sendAnnouncement } from "@/services/api";
import { isBackendConfigured, backendSupports } from "@/config/integration";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { RatingStars } from "@/components/project/RatingStars";
import type { BusinessCustomer, OwnerMessageEntry } from "@/types";

const usingLiveData = isBackendConfigured && backendSupports.customers;

type ActivityFilter = "all" | "bookings" | "reviews" | "chats";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

const BOOKING_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-green-50 text-green-700",
  declined: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-600",
};

function SummaryChip({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "gray" | "amber" | "green";
}) {
  const tones = {
    gray: "bg-gray-100 text-gray-600",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-green-50 text-green-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}
    >
      {icon}
      {label}
    </span>
  );
}

function ReplyBox({
  customer,
  onSend,
}: {
  customer: BusinessCustomer;
  onSend: (customerId: string, content: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);

  function submit() {
    const content = draft.trim();
    if (!content) return;
    onSend(customer.id, content);
    setDraft("");
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
        Send a personal message
      </p>
      <div className="mt-2 flex items-start gap-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Message ${customer.name.split(" ")[0]} about an update to your business…`}
          rows={2}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim()}
          style={{ backgroundColor: theme.colors.primary }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-bold text-white disabled:opacity-40"
        >
          <Send size={14} />
          Send
        </button>
      </div>
      {sent && (
        <p className="mt-1.5 text-xs font-semibold text-green-600">
          Sent — this is a mock action for now, nothing was actually delivered.
        </p>
      )}
    </div>
  );
}

// AnnouncementModal — bulk email compose. Available to both owners (their
// own business's customers) and admins (any business, via the businessId
// scope already passed into CustomersPage). Sending is mocked for now, same
// as ReplyBox above — wire this to POST /businesses/:id/announcements once
// that endpoint exists (it can reuse the backend's MailService).
function AnnouncementModal({
  businessId,
  candidates,
  onClose,
}: {
  businessId: string;
  candidates: BusinessCustomer[];
  onClose: () => void;
}) {
  const mailable = useMemo(
    () =>
      candidates.filter((c): c is BusinessCustomer & { email: string } =>
        Boolean(c.email),
      ),
    [candidates],
  );
  const skipped = candidates.length - mailable.length;

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(mailable.map((c) => c.id)),
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === mailable.length
        ? new Set()
        : new Set(mailable.map((c) => c.id)),
    );
  }

  async function submit() {
    if (!subject.trim() || !body.trim() || selected.size === 0) return;
    setSending(true);
    setError(null);
    try {
      // Customer ids from this list are "<businessId>:<userId>" (see
      // CustomersService on the backend) — the API only wants the user id.
      const customerIds = Array.from(selected).map(
        (id) => id.split(":").pop() ?? id,
      );
      const response = await sendAnnouncement(businessId, {
        subject: subject.trim(),
        message: body.trim(),
        customerIds,
      });
      setResult({ sent: response.sent, failed: response.failed });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't send the announcement.",
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
            Email announcement
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
                Sent to {result.sent} customer{result.sent === 1 ? "" : "s"}.
                Check your Mailtrap inbox to see it land.
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
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Subject
              </label>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="e.g. We're closed this Friday for maintenance"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Message
              </label>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={5}
                placeholder="Write your announcement…"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Recipients ({selected.size}/{mailable.length})
                </label>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs font-bold text-gray-500 hover:text-gray-900"
                >
                  {selected.size === mailable.length
                    ? "Deselect all"
                    : "Select all"}
                </button>
              </div>
              <div className="mt-1.5 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
                {mailable.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-gray-400">
                    None of the customers in this list have an email on file.
                  </p>
                ) : (
                  mailable.map((customer) => (
                    <label
                      key={customer.id}
                      className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-sm hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(customer.id)}
                        onChange={() => toggle(customer.id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-gray-700">{customer.name}</span>
                      <span className="text-xs text-gray-400">
                        {customer.email}
                      </span>
                    </label>
                  ))
                )}
              </div>
              {skipped > 0 && (
                <p className="mt-1.5 text-xs text-gray-400">
                  {skipped} customer{skipped === 1 ? "" : "s"} skipped — no
                  email on file.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={
                !subject.trim() ||
                !body.trim() ||
                selected.size === 0 ||
                sending
              }
              style={{ backgroundColor: theme.colors.primary }}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              <Send size={14} />
              {sending
                ? "Sending…"
                : `Send to ${selected.size} customer${selected.size === 1 ? "" : "s"}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomerCard({
  customer,
  editable,
  onSend,
}: {
  customer: BusinessCustomer;
  editable: boolean;
  onSend: (customerId: string, content: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasBookings = customer.bookings.length > 0;
  const hasReview = Boolean(customer.review);
  const hasChat = customer.chatLog.length > 0;
  const hasMessages = customer.messages.length > 0;

  return (
    <article className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="font-bold text-gray-900">{customer.name}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {[customer.email, customer.phone].filter(Boolean).join(" · ") ||
              "No contact details on file"}
          </p>
          <p className="mt-1 text-xs font-semibold text-gray-400">
            {customer.businessName}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {hasBookings && (
            <SummaryChip
              icon={<CalendarCheck size={12} />}
              label={`${customer.bookings.length} booking${customer.bookings.length > 1 ? "s" : ""}`}
              tone="green"
            />
          )}
          {hasReview && (
            <SummaryChip
              icon={<Star size={12} />}
              label={`${customer.review!.rating}★ review`}
              tone="amber"
            />
          )}
          {hasChat && (
            <SummaryChip
              icon={<MessageCircle size={12} />}
              label={`${customer.chatLog.length} chat message${customer.chatLog.length > 1 ? "s" : ""}`}
              tone="gray"
            />
          )}
          {hasMessages && (
            <SummaryChip
              icon={<MessagesSquare size={12} />}
              label="Message thread"
              tone="gray"
            />
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-gray-100 p-4">
          {/* Bookings */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
              <CalendarCheck size={13} />
              Booking history
            </p>
            {hasBookings ? (
              <ul className="mt-2 space-y-1.5">
                {customer.bookings.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-700">
                      {formatDate(booking.date)} · {booking.time}
                      {booking.service ? ` · ${booking.service}` : ""}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        BOOKING_STATUS_STYLES[booking.status] ??
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-sm text-gray-400">
                No bookings from this customer.
              </p>
            )}
          </div>

          {/* Review */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
              <Star size={13} />
              Review
            </p>
            {customer.review ? (
              <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <RatingStars rating={customer.review.rating} readOnly />
                  <span className="text-xs text-gray-400">
                    {formatDate(customer.review.createdAt)}
                  </span>
                </div>
                {customer.review.title && (
                  <p className="mt-1.5 text-sm font-bold text-gray-900">
                    {customer.review.title}
                  </p>
                )}
                <p className="mt-0.5 text-sm text-gray-600">
                  {customer.review.message}
                </p>
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-gray-400">
                No review left yet.
              </p>
            )}
          </div>

          {/* Chatbot history */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
              <MessageCircle size={13} />
              Chatbot history
            </p>
            {hasChat ? (
              <div className="mt-2 space-y-1.5">
                {customer.chatLog.map((line) => (
                  <div
                    key={line.id}
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      line.sender === "user"
                        ? "ml-auto bg-gray-900 text-white"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    <p>{line.content}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        line.sender === "user"
                          ? "text-gray-300"
                          : "text-gray-400"
                      }`}
                    >
                      {formatDateTime(line.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-gray-400">
                This customer hasn&apos;t used the chatbot on this listing.
              </p>
            )}
          </div>

          {/* Owner <-> customer messages */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
              <MessagesSquare size={13} />
              Messages
            </p>
            {hasMessages ? (
              <div className="mt-2 space-y-1.5">
                {customer.messages.map((message: OwnerMessageEntry) => (
                  <div
                    key={message.id}
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      message.sender === "owner"
                        ? "ml-auto text-white"
                        : "bg-gray-50 text-gray-700"
                    }`}
                    style={
                      message.sender === "owner"
                        ? { backgroundColor: theme.colors.primary }
                        : undefined
                    }
                  >
                    <p>{message.content}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        message.sender === "owner"
                          ? "text-white/70"
                          : "text-gray-400"
                      }`}
                    >
                      {message.sender === "owner" ? "You" : customer.name} ·{" "}
                      {formatDateTime(message.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-gray-400">
                No messages sent yet.
              </p>
            )}

            {editable && <ReplyBox customer={customer} onSend={onSend} />}
          </div>
        </div>
      )}
    </article>
  );
}

export function CustomersPage({
  role,
  businessId,
  businessName,
  backHref,
  backLabel,
}: {
  role: "owner" | "admin";
  // Restrict to one business (admin view). Omitted for the owner view, which
  // shows every business the owner has — filterable via the dropdown below.
  businessId?: string;
  businessName?: string;
  backHref: string;
  backLabel: string;
}) {
  const [customers, setCustomers] = useState<BusinessCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [search, setSearch] = useState("");
  const [businessPick, setBusinessPick] = useState("all");
  const [announcementOpen, setAnnouncementOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getBusinessCustomers(businessId)
      .then((data) => {
        if (!cancelled) setCustomers(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Couldn't load customers.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const businessOptions = useMemo(() => {
    if (businessId) return [];
    const seen = new Map<string, string>();
    for (const customer of customers) {
      seen.set(customer.businessId, customer.businessName);
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [businessId, customers]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customers.filter((customer) => {
      if (businessId && customer.businessId !== businessId) return false;
      if (
        !businessId &&
        businessPick !== "all" &&
        customer.businessId !== businessPick
      )
        return false;
      if (filter === "bookings" && customer.bookings.length === 0) return false;
      if (filter === "reviews" && !customer.review) return false;
      if (filter === "chats" && customer.chatLog.length === 0) return false;
      if (
        query &&
        ![customer.name, customer.email, customer.phone, customer.businessName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
        return false;
      return true;
    });
  }, [businessId, businessPick, customers, filter, search]);

  // The announcement endpoint is scoped to one business — pin it down to
  // whichever single business is currently in view, if any.
  const announcementBusinessId =
    businessId ?? (businessPick !== "all" ? businessPick : undefined);

  function handleSend(customerId: string, content: string) {
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              messages: [
                ...customer.messages,
                {
                  id: `msg-local-${Date.now()}`,
                  sender: "owner",
                  content,
                  createdAt: new Date().toISOString(),
                  read: true,
                },
              ],
            }
          : customer,
      ),
    );
  }

  const tabs: { id: ActivityFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "bookings", label: "Bookings" },
    { id: "reviews", label: "Reviews" },
    { id: "chats", label: "Chats" },
  ];

  // The owner route sits under the public site layout, which has a fixed
  // navbar (needs pt-24). The admin route sits inside AdminShell, which has
  // no fixed navbar of its own, so it only needs normal page padding.
  const wrapperPadding =
    role === "owner"
      ? "px-4 pb-16 pt-24 sm:px-6 sm:pt-28"
      : "px-4 pb-16 pt-8 sm:px-8 sm:pt-10";

  return (
    <main className={`min-h-screen bg-gray-50 ${wrapperPadding}`}>
      <div className="mx-auto max-w-5xl">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={15} />
          {backLabel}
        </Link>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-400">
          {role === "owner" ? "My dashboard" : "Admin"}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-gray-950 sm:text-4xl">
          {businessName ?? "Customers"}
        </h1>
        <p className="mt-2 text-gray-500">
          {role === "owner"
            ? "Everyone who's booked, reviewed, or chatted about your business, in one place — reply with a personal message any time, or email everyone an announcement."
            : "Bookings, reviews, and chatbot history for this business — send an email announcement to its customers on the owner's behalf."}
        </p>

        {!usingLiveData && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800">
            Showing sample data — connect NEXT_PUBLIC_API_URL to see your real
            customers.
          </div>
        )}
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-600">
          Bookings and reviews shown here are real. Chatbot history and message
          threads aren&apos;t stored on the backend yet, so those stay empty for
          now.
        </div>

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
                </button>
              );
            })}
          </div>

          {!businessId && businessOptions.length > 1 && (
            <select
              value={businessPick}
              onChange={(event) => setBusinessPick(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
            >
              <option value="all">All my businesses</option>
              {businessOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          )}

          <label className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by customer name, email or phone…"
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm"
            />
          </label>

          <button
            type="button"
            onClick={() => setAnnouncementOpen(true)}
            disabled={visible.length === 0 || !announcementBusinessId}
            title={
              !announcementBusinessId
                ? "Pick a single business above to email its customers"
                : undefined
            }
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Mail size={15} />
            Email announcement
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            <LoadingSpinner />
          ) : loadError ? (
            <EmptyState message={loadError} />
          ) : visible.length === 0 ? (
            <EmptyState
              message={
                customers.length === 0
                  ? "No customer activity yet."
                  : "Nothing matches this filter."
              }
            />
          ) : (
            visible.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                editable={role === "owner"}
                onSend={handleSend}
              />
            ))
          )}
        </div>
      </div>

      {announcementOpen && announcementBusinessId && (
        <AnnouncementModal
          businessId={announcementBusinessId}
          candidates={visible}
          onClose={() => setAnnouncementOpen(false)}
        />
      )}
    </main>
  );
}
