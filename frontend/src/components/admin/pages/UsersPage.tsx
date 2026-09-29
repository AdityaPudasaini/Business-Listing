"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, Mail, Search, Send, ShieldCheck, User, X } from "lucide-react";
import {
  type AdminUser,
  getAdminUsers,
  getSession,
  sendBroadcast,
  updateUserRole,
  updateUserBanStatus,
} from "@/services/api";
import { PageHeader } from "@/components/admin/shared";

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
                ? "bg-primary/10 text-primary"
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
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
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
