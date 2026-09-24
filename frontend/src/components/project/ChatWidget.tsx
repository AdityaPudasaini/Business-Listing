// ChatWidget.tsx — floating chat launcher + panel, mounted once in layout.tsx
// so it's present on every page.
//
// LISTING-SPECIFIC MODE: on a /listings/[slug] page, BusinessDetailPage
// registers the business being viewed into useActiveListingChat. Once
// backendSupports.chats is true, listing-mode conversations are persisted
// via POST /chats and POST /chats/:id/messages, so the business owner can
// see them later under Dashboard -> Chat logs. Until then (or if a call
// fails), it falls straight back to the local getChatReply() logic exactly
// like before -- nothing breaks either way.
"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Paperclip, Smile, Search, Send } from "lucide-react";
import { theme } from "@/config/theme";
import { getActiveVertical } from "@/features/verticals";
import { useActiveListingChat } from "@/hooks/useActiveListingChat";
import { useDemoAuthStore } from "@/features/auth/useDemoAuthStore";
import { getChatReply } from "@/services/chat";
import {
  startChat,
  sendChatMessage,
  getChatMessages,
  endChat,
} from "@/services/api";
import { backendSupports } from "@/config/integration";

interface ChatMessage {
  id: string;
  // "owner" / "admin" are real humans replying from the dashboard / admin panel.
  from: "bot" | "user" | "owner" | "admin";
  text: string;
}

// How often the open widget checks for owner/admin replies.
const POLL_MS = 4000;

interface QuickReply {
  id: string;
  label: string;
  icon: string; // single emoji, matches the reference design's pill icons
}

let messageIdCounter = 0;
function nextId() {
  messageIdCounter += 1;
  return `msg-${messageIdCounter}`;
}

// Remembers which chat session belongs to which listing (per account, or
// "guest"), so leaving a listing and coming back picks the conversation up
// again instead of starting a new one. Only the session id is stored; the
// thread itself is reloaded from the server, which is the source of truth.
const SESSIONS_KEY = "chat-sessions";

function sessionKey(accountId: string | null | undefined, businessId: string) {
  return `${accountId ?? "guest"}:${businessId}`;
}

function readStoredSessions(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeStoredSession(key: string, sessionId: string | null) {
  try {
    const all = readStoredSessions();
    if (sessionId) all[key] = sessionId;
    else delete all[key];
    window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(all));
  } catch {
    // Storage blocked (private mode etc.) — chats just won't resume.
  }
}

export function ChatWidget() {
  const vertical = getActiveVertical();
  const business = useActiveListingChat((s) => s.business);
  const openBooking = useActiveListingChat((s) => s.openBooking);
  const accountName = useDemoAuthStore((s) => s.user?.name);
  const accountId = useDemoAuthStore((s) => s.user?.id);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  // true once an owner/admin has joined — the bot stops answering.
  const [takenOver, setTakenOver] = useState(false);
  // Server ids of staff messages already on screen, so polling never duplicates.
  const seenStaffIdsRef = useRef<Set<string>>(new Set());
  const handoffNotedRef = useRef(false);
  // Bumped every time the chat is ended, so an in-flight reply from the old
  // chat can't leak into the fresh one.
  const epochRef = useRef(0);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Tracks which business AND which account the current messages/session
  // belong to, so reopening the widget on the same listing as the same
  // account continues the conversation instead of starting a brand new
  // session every time — but a *different* account (or logging out) still
  // gets a clean slate instead of inheriting someone else's chat history.
  const sessionBusinessIdRef = useRef<string | null>(null);
  const sessionAccountIdRef = useRef<string | null | undefined>(undefined);

  const botName = `${vertical.brandName} Assistant`;

  const generalQuickReplies: QuickReply[] = [
    { id: "browse", label: `Find a ${vertical.labels.business}`, icon: "🔍" },
    {
      id: "register",
      label: `List my ${vertical.labels.business}`,
      icon: "📋",
    },
  ];

  const listingQuickReplies: QuickReply[] = business
    ? [
        {
          id: "book",
          label: openBooking ? "Book here" : "How do I book?",
          icon: "📅",
        },
        { id: "services", label: "What services do they offer?", icon: "🔧" },
        { id: "location", label: "Where are they located?", icon: "📍" },
        { id: "contact", label: "How do I contact them?", icon: "📞" },
      ]
    : [];

  const quickReplies = business ? listingQuickReplies : generalQuickReplies;

  useEffect(() => {
    if (!open) return;

    if (business) {
      const isNewBusiness = business.id !== sessionBusinessIdRef.current;
      const isNewAccount = (accountId ?? null) !== sessionAccountIdRef.current;
      if (isNewBusiness || isNewAccount) {
        setMessages([
          {
            id: nextId(),
            from: "bot",
            text: `Hi 👋 I can help with questions about ${business.name}.`,
          },
          { id: nextId(), from: "bot", text: "Here's what I can do:" },
        ]);
        setChatSessionId(null);
        setTakenOver(false);
        seenStaffIdsRef.current = new Set();
        handoffNotedRef.current = false;
        setVisitorName(accountName ?? "");
        sessionBusinessIdRef.current = business.id;
        sessionAccountIdRef.current = accountId ?? null;

        // Been chatting on this listing before? Reload that conversation from
        // the server (it has the full thread, including owner/admin replies).
        const storedId = backendSupports.chats
          ? readStoredSessions()[sessionKey(accountId, business.id)]
          : undefined;
        if (storedId) {
          const forBusiness = business.id;
          getChatMessages(storedId)
            .then(({ takenOver: taken, messages: server }) => {
              // The visitor already moved on to another listing — drop it.
              if (sessionBusinessIdRef.current !== forBusiness) return;
              if (server.length === 0) return;
              server.forEach((m) => {
                if (m.from === "owner" || m.from === "admin") {
                  seenStaffIdsRef.current.add(m.id);
                }
              });
              handoffNotedRef.current = taken;
              setChatSessionId(storedId);
              setTakenOver(taken);
              setMessages(
                server.map((m) => ({ id: m.id, from: m.from, text: m.text })),
              );
            })
            .catch(() => {
              // Session gone (deleted / DB reset) — forget it, start fresh.
              writeStoredSession(sessionKey(accountId, forBusiness), null);
            });
        }
      }
      // Same business AND same account as last time — keep the existing
      // messages and chatSessionId so the conversation and its history
      // continue.
    } else if (sessionBusinessIdRef.current !== null || messages.length === 0) {
      // Not on a listing (or just left one): show the general greeting rather
      // than the previous listing's thread. That thread is resumed from the
      // server when the visitor returns to the listing.
      sessionBusinessIdRef.current = null;
      sessionAccountIdRef.current = undefined;
      setChatSessionId(null);
      setTakenOver(false);
      seenStaffIdsRef.current = new Set();
      handoffNotedRef.current = false;
      setMessages([
        {
          id: nextId(),
          from: "bot",
          text: `Hi 👋 We help you find and connect with trusted ${vertical.labels.business}s near you, instantly.`,
        },
        { id: nextId(), from: "bot", text: "Here are a few ways I can help:" },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, business?.id, accountId]);

  // Pull in replies from the owner/admin. Only runs while the panel is open
  // and a session exists; only appends staff messages we haven't shown yet
  // (the visitor's own messages and the bot's replies are already local).
  useEffect(() => {
    if (!open || !chatSessionId || !backendSupports.chats) return;
    let cancelled = false;

    async function poll() {
      if (!chatSessionId) return;
      try {
        const { takenOver: taken, messages: server } =
          await getChatMessages(chatSessionId);
        if (cancelled) return;
        setTakenOver(taken);
        const fresh = server.filter(
          (m) =>
            (m.from === "owner" || m.from === "admin") &&
            !seenStaffIdsRef.current.has(m.id),
        );
        if (fresh.length === 0) return;
        fresh.forEach((m) => seenStaffIdsRef.current.add(m.id));
        setMessages((prev) => [
          ...prev,
          ...fresh.map((m) => ({ id: m.id, from: m.from, text: m.text })),
        ]);
      } catch {
        // Polling is best-effort; the next tick will try again.
      }
    }

    void poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [open, chatSessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  // Lazily creates the session on the first real message, so an opened-but-
  // unused widget never leaves an empty session behind. Returns null (never
  // throws) so the caller can fall back to the local canned reply.
  //
  // Result: `text` is the bot's reply; `silent` means the message was saved but
  // a human has taken over, so no bot reply (and no canned fallback) is wanted.
  async function getPersistedReply(
    userText: string,
    epoch: number,
  ): Promise<{ text: string | null; silent: boolean }> {
    if (!business || !backendSupports.chats)
      return { text: null, silent: false };
    try {
      let sessionId = chatSessionId;
      if (!sessionId) {
        const session = await startChat(
          business.id,
          visitorName.trim() || undefined,
        );
        sessionId = session.id;
        // Chat was ended while the session was still being created: close
        // the orphan and don't resurrect anything.
        if (epoch !== epochRef.current) {
          void endChat(sessionId).catch(() => {});
          return { text: null, silent: true };
        }
        setChatSessionId(sessionId);
        writeStoredSession(sessionKey(accountId, business.id), sessionId);
      }
      const result = await sendChatMessage(sessionId, userText);
      if (epoch === epochRef.current) setTakenOver(result.takenOver);
      if (!result.reply) return { text: null, silent: result.takenOver };
      return { text: result.reply.text, silent: false };
    } catch (err) {
      // This used to swallow the error completely, which is exactly why the
      // widget "worked" for the visitor (it fell back to a local canned
      // reply) while the real message silently never reached the backend —
      // leaving the dashboard with only the session's opening greeting and
      // nothing after it. Logging here doesn't fix the underlying failure,
      // but it's what makes that failure visible instead of invisible.
      console.error("Chat message failed to persist:", err);
      return { text: null, silent: false };
    }
  }

  async function replyTo(userText: string) {
    setTyping(true);
    const epoch = epochRef.current;
    const [persisted] = await Promise.all([
      getPersistedReply(userText, epoch),
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);
    if (epoch !== epochRef.current) return; // chat was ended meanwhile

    // A human has taken over: the message is saved, the bot stays quiet. Show
    // a one-time note so the visitor knows why nothing is answering instantly.
    if (persisted.silent) {
      if (!handoffNotedRef.current) {
        handoffNotedRef.current = true;
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            from: "bot",
            text: "A team member is handling this chat now — they'll reply here.",
          },
        ]);
      }
      setTyping(false);
      return;
    }

    const replyText =
      persisted.text ?? (await getChatReply(userText, { vertical, business }));

    setMessages((prev) => [
      ...prev,
      { id: nextId(), from: "bot", text: replyText },
    ]);
    setTyping(false);
  }

  // Ends the conversation for good: tells the server (so the owner sees it
  // ended and can't reply into the void), forgets the saved session, and puts
  // the widget back to its starting state.
  async function handleEndChat() {
    const endedSessionId = chatSessionId;
    epochRef.current += 1;
    setConfirmingEnd(false);

    if (business) {
      writeStoredSession(sessionKey(accountId, business.id), null);
    }
    if (endedSessionId && backendSupports.chats) {
      try {
        await endChat(endedSessionId);
      } catch (err) {
        console.error("Could not end chat on the server:", err);
      }
    }

    setChatSessionId(null);
    setTakenOver(false);
    seenStaffIdsRef.current = new Set();
    handoffNotedRef.current = false;
    setInput("");
    setTyping(false);
    setVisitorName(accountName ?? "");
    setMessages(
      business
        ? [
            {
              id: nextId(),
              from: "bot",
              text: `Hi 👋 I can help with questions about ${business.name}.`,
            },
            { id: nextId(), from: "bot", text: "Here's what I can do:" },
          ]
        : [
            {
              id: nextId(),
              from: "bot",
              text: `Hi 👋 We help you find and connect with trusted ${vertical.labels.business}s near you, instantly.`,
            },
            {
              id: nextId(),
              from: "bot",
              text: "Here are a few ways I can help:",
            },
          ],
    );
  }

  const canEndChat = messages.some((m) => m.from === "user");

  function sendQuickReply(reply: QuickReply) {
    setMessages((prev) => [
      ...prev,
      { id: nextId(), from: "user", text: reply.label },
    ]);

    if (reply.id === "book" && business && openBooking) {
      replyTo(reply.label);
      openBooking();
      setOpen(false);
      return;
    }

    replyTo(reply.label);
  }

  function sendTyped(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: nextId(), from: "user", text: trimmed },
    ]);
    setInput("");
    replyTo(trimmed);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
        style={{ backgroundColor: theme.colors.primary }}
      >
        <span className="relative flex h-6 w-6 items-center justify-center">
          <MessageCircle
            size={24}
            color="#fff"
            className={`absolute transition-all duration-300 ${open ? "rotate-45 opacity-0 scale-75" : "rotate-0 opacity-100 scale-100"}`}
          />
          <X
            size={24}
            color="#fff"
            className={`absolute transition-all duration-300 ${open ? "rotate-0 opacity-100 scale-100" : "-rotate-45 opacity-0 scale-75"}`}
          />
        </span>
      </button>

      <div
        className={`fixed bottom-24 right-6 z-50 flex h-[520px] w-[360px] max-w-[calc(100vw-2rem)] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 ease-out ${
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-95 opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div
          className="flex items-center gap-3 px-4 py-4"
          style={{
            background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`,
          }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <MessageCircle size={20} color="#fff" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">{botName}</p>
            <p className="truncate text-xs text-white/80">
              {business
                ? `Asking about ${business.name}`
                : "We help instantly, 24/7"}
            </p>
          </div>
          {canEndChat && (
            <button
              type="button"
              onClick={() => setConfirmingEnd(true)}
              className="rounded-full px-2.5 py-1 text-xs font-semibold text-white/90 transition-colors hover:bg-white/20"
            >
              End chat
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="rounded-full p-1 transition-colors hover:bg-white/20"
          >
            <X size={18} color="#fff" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`chat-msg-in flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  m.from === "user"
                    ? "rounded-br-sm text-white"
                    : m.from === "bot"
                      ? "rounded-bl-sm border border-gray-100 bg-gray-50 text-gray-700"
                      : "rounded-bl-sm border border-amber-200 bg-amber-50 text-gray-800"
                }`}
                style={
                  m.from === "user"
                    ? { backgroundColor: theme.colors.primary }
                    : undefined
                }
              >
                {(m.from === "owner" || m.from === "admin") && (
                  <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    {m.from === "admin"
                      ? "Support team"
                      : business
                        ? business.name
                        : "Owner"}
                  </span>
                )}
                {m.text}
              </div>
            </div>
          ))}

          {typing && (
            <div className="chat-msg-in flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-gray-100 bg-gray-50 px-4 py-3">
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}

          {business &&
            !accountName &&
            !chatSessionId &&
            messages.length <= 2 &&
            !typing && (
              // Name prompt only makes sense right at the very start of a
              // fresh conversation, so this one stays gated on message count.
              <label className="chat-msg-in block pt-1 text-xs font-medium text-gray-500">
                Your name (optional, so {business.name} knows who&apos;s asking)
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="e.g. Rick"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-400"
                />
              </label>
            )}

          {!typing &&
            !takenOver &&
            messages.length > 0 &&
            messages[messages.length - 1].from === "bot" && (
              <div className="flex flex-col gap-2 pt-1">
                {quickReplies.map((reply, i) => (
                  <button
                    key={reply.id}
                    type="button"
                    onClick={() => sendQuickReply(reply)}
                    className="chat-msg-in rounded-full border px-4 py-2 text-left text-sm font-medium transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50 active:scale-95"
                    style={{
                      borderColor: theme.colors.primary,
                      color: theme.colors.primary,
                      animationDelay: `${i * 80}ms`,
                    }}
                  >
                    {reply.icon} {reply.label}
                  </button>
                ))}
              </div>
            )}
        </div>

        {confirmingEnd && (
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium text-gray-600">
              End this chat and start over?
            </p>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setConfirmingEnd(false)}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Keep chatting
              </button>
              <button
                type="button"
                onClick={() => void handleEndChat()}
                style={{ backgroundColor: theme.colors.primary }}
                className="rounded-full px-3 py-1 text-xs font-semibold text-white hover:opacity-90"
              >
                End chat
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={sendTyped}
          className="flex items-center gap-2 border-t border-gray-100 px-3 py-3"
        >
          <Paperclip size={18} className="shrink-0 text-gray-300" />
          <Smile size={18} className="shrink-0 text-gray-300" />
          <Search size={18} className="shrink-0 text-gray-300" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type message..."
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
          <button
            type="submit"
            aria-label="Send"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-90"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Send size={14} color="#fff" />
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes chatMsgIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .chat-msg-in {
          animation: chatMsgIn 0.25s ease-out both;
        }
      `}</style>
    </>
  );
}
