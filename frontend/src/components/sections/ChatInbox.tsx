"use client";

// ChatInbox — shared chat-log list + live reply box.
//
// Used by both the owner dashboard (/dashboard/chats, mode="owner") and the
// admin panel (/admin/chats, mode="admin"). The only differences between the
// two are which sessions get fetched and how the "you" bubbles are labelled;
// the backend decides the real sender ("owner" / "admin") from the JWT.
//
// Live updates are plain polling (every POLL_MS while the tab is visible) —
// no websockets needed for this volume of chat.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, MessageCircle, RefreshCw, Search, Send } from "lucide-react";
import { theme } from "@/config/theme";
import {
  closeChat,
  getAdminChats,
  getReceivedChats,
  replyToChat,
} from "@/services/api";
import { useDemoAuthStore } from "@/features/auth/useDemoAuthStore";
import type { ChatMessage, ChatSender, ChatSession } from "@/types";

export type ChatInboxMode = "owner" | "admin";

const POLL_MS = 5000;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

// Who is "me" in this inbox? Those bubbles go on the right.
function mySender(mode: ChatInboxMode): ChatSender {
  return mode === "admin" ? "admin" : "owner";
}

function senderLabel(from: ChatSender, mode: ChatInboxMode, visitor: string) {
  if (from === mySender(mode)) return "You";
  if (from === "user") return visitor;
  if (from === "bot") return "Bot";
  return from === "admin" ? "Admin" : "Owner";
}

function Bubble({
  message,
  mode,
  visitor,
}: {
  message: ChatMessage;
  mode: ChatInboxMode;
  visitor: string;
}) {
  const mine = message.from === mySender(mode);
  const style = mine
    ? "text-white"
    : message.from === "user"
      ? "border border-gray-200 bg-white text-gray-700"
      : message.from === "bot"
        ? "bg-gray-100 text-gray-500"
        : "border border-amber-200 bg-amber-50 text-gray-800"; // the *other* human

  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <span className="mb-0.5 px-1 text-[10px] font-semibold text-gray-400">
        {senderLabel(message.from, mode, visitor)} ·{" "}
        {formatDateTime(message.createdAt)}
      </span>
      <div
        style={mine ? { backgroundColor: theme.colors.primary } : undefined}
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-1.5 text-xs ${style}`}
      >
        {message.text}
      </div>
    </div>
  );
}

function ChatSessionCard({
  session,
  mode,
  onSent,
  onEnded,
}: {
  session: ChatSession;
  mode: ChatInboxMode;
  onSent: (sessionId: string, message: ChatMessage) => void;
  onEnded: (sessionId: string, message: ChatMessage | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  const visitor = session.visitorName || session.user?.name || "Guest";
  const lastMessage = session.messages[session.messages.length - 1];

  // Keep the newest message in view as the thread grows (own send or poll).
  useEffect(() => {
    if (!expanded) return;
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [expanded, session.messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    setError("");
    try {
      const saved = await replyToChat(session.id, message);
      onSent(session.id, saved);
      setDraft("");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not send reply.",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleEnd() {
    if (ending) return;
    setEnding(true);
    setError("");
    try {
      const closing = await closeChat(session.id);
      onEnded(session.id, closing);
      setConfirmingEnd(false);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not end the chat.",
      );
    } finally {
      setEnding(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold text-gray-900">{visitor}</p>
          <p className="mt-0.5 text-sm text-gray-500">
            on <span className="font-semibold">{session.business.name}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="whitespace-nowrap text-xs text-gray-400">
            {formatDateTime(session.updatedAt)}
          </span>
          {session.endedAt ? (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">
              Ended
            </span>
          ) : session.takenOver ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              Human replied
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
              <Bot size={10} />
              Bot only
            </span>
          )}
        </div>
      </div>

      {lastMessage && !expanded && (
        <p className="mt-3 truncate text-sm text-gray-500">
          {senderLabel(lastMessage.from, mode, visitor)}: {lastMessage.text}
        </p>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{ color: theme.colors.primary }}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold hover:opacity-70"
      >
        <MessageCircle size={13} />
        {expanded
          ? "Hide conversation"
          : `View & reply (${session.messages.length})`}
      </button>

      {expanded && (
        <>
          <div
            ref={threadRef}
            className="mt-3 max-h-80 space-y-2.5 overflow-y-auto rounded-lg bg-gray-50 p-3"
          >
            {session.messages.map((m) => (
              <Bubble key={m.id} message={m} mode={mode} visitor={visitor} />
            ))}
          </div>

          {session.endedAt ? (
            <p className="mt-3 text-xs text-gray-500">
              This chat ended on {formatDateTime(session.endedAt)}. You can
              still read it, but replies are turned off.
            </p>
          ) : (
            <form
              onSubmit={handleSend}
              className="mt-3 flex items-center gap-2"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={1000}
                placeholder={
                  mode === "admin"
                    ? `Reply to ${visitor} as admin…`
                    : `Reply to ${visitor}…`
                }
                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                aria-label="Send reply"
                style={{ backgroundColor: theme.colors.primary }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition disabled:opacity-40"
              >
                <Send size={15} />
              </button>
            </form>
          )}
          {!session.endedAt && (
            <div className="mt-3 flex items-center justify-end gap-2 text-xs">
              {confirmingEnd ? (
                <>
                  <span className="text-gray-500">
                    End this chat for the visitor?
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmingEnd(false)}
                    className="rounded-full border border-gray-200 px-3 py-1 font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleEnd()}
                    disabled={ending}
                    style={{ backgroundColor: theme.colors.primary }}
                    className="rounded-full px-3 py-1 font-semibold text-white disabled:opacity-50"
                  >
                    End chat
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingEnd(true)}
                  className="font-semibold text-gray-500 hover:text-red-600"
                >
                  End chat
                </button>
              )}
            </div>
          )}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          {!session.takenOver && !session.endedAt && (
            <p className="mt-2 text-[11px] text-gray-400">
              Once you reply, the auto-reply bot stops answering in this chat.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function ChatInbox({ mode }: { mode: ChatInboxMode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  // Re-fetch when the signed-in account changes so a previous account's chats
  // are never left on screen (see the original ChatLogsPage note).
  const userId = useDemoAuthStore((s) => s.user?.id);

  const fetchSessions = mode === "admin" ? getAdminChats : getReceivedChats;

  const load = useCallback(
    (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError("");
      }
      return fetchSessions()
        .then(setSessions)
        .catch((reason) => {
          // A failed background poll shouldn't blow away a working list.
          if (!silent) {
            setError(
              reason instanceof Error
                ? reason.message
                : "Could not load chats.",
            );
          }
        })
        .finally(() => {
          if (!silent) setLoading(false);
        });
    },
    [fetchSessions],
  );

  useEffect(() => {
    setSessions([]);
    void load();
  }, [load, userId]);

  // Poll for new visitor messages while the tab is visible.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Show my own reply immediately instead of waiting for the next poll.
  const handleSent = useCallback((sessionId: string, message: ChatMessage) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              takenOver: true,
              updatedAt: message.createdAt || s.updatedAt,
              messages: s.messages.some((m) => m.id === message.id)
                ? s.messages
                : [...s.messages, message],
            }
          : s,
      ),
    );
  }, []);

  // Mark a chat ended right away (and show the closing message) instead of
  // waiting for the next poll.
  const handleEnded = useCallback(
    (sessionId: string, closing: ChatMessage | null) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                takenOver: true,
                endedAt: closing?.createdAt || new Date().toISOString(),
                messages:
                  closing && !s.messages.some((m) => m.id === closing.id)
                    ? [...s.messages, closing]
                    : s.messages,
              }
            : s,
        ),
      );
    },
    [],
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sessions.filter(
      (s) =>
        !query ||
        [s.business.name, s.visitorName, s.user?.name, s.user?.email]
          .join(" ")
          .toLowerCase()
          .includes(query),
    );
  }, [sessions, search]);

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by visitor or listing…"
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

      <div className="mt-6 grid items-start gap-4 md:grid-cols-2">
        {loading ? (
          <p className="text-sm text-gray-500">Loading chats…</p>
        ) : (
          visible.map((session) => (
            <ChatSessionCard
              key={session.id}
              session={session}
              mode={mode}
              onSent={handleSent}
              onEnded={handleEnded}
            />
          ))
        )}
      </div>

      {!loading && !error && visible.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="font-bold text-gray-900">
            {sessions.length === 0
              ? "No chats yet"
              : "Nothing matches your search"}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {sessions.length === 0
              ? mode === "admin"
                ? "When a visitor chats with the widget on any listing, it'll show up here."
                : "When a visitor chats with the widget on one of your listings, it'll show up here."
              : "Try a different search term."}
          </p>
        </div>
      )}
    </>
  );
}
