// ChatWidget.tsx — floating chat launcher + panel, mounted once in layout.tsx
// so it's present on every page.
//
// All reply logic lives in services/chat.ts (getChatReply), NOT here — this
// component only handles UI/state (open/close, message list, quick-reply
// buttons) and awaits getChatReply() for what to say back. That's the seam
// to swap for a real AI backend later; this file shouldn't need to change
// when that happens.
//
// LISTING-SPECIFIC MODE: on a /listings/[slug] page, BusinessDetailPage
// registers the business being viewed into useActiveListingChat (a small
// Zustand store — see hooks/useActiveListingChat.ts). This widget reads
// that store and, whenever a business is active, swaps the generic
// site-wide greeting/quick-replies for ones about that specific business —
// matching the reference site's behavior (autohubnepal.com shows a richer,
// service-specific quick-reply menu on an individual garage's page). The
// "Book here" quick reply calls the real BookingModal on the page via the
// same store, rather than just replying with text about booking.
"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Paperclip, Smile, Search, Send } from "lucide-react";
import { theme } from "@/config/theme";
import { getActiveVertical } from "@/features/verticals";
import { useActiveListingChat } from "@/hooks/useActiveListingChat";
import { getChatReply } from "@/services/chat";

interface ChatMessage {
  id: string;
  from: "bot" | "user";
  text: string;
}

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

export function ChatWidget() {
  const vertical = getActiveVertical();
  const business = useActiveListingChat((s) => s.business);
  const openBooking = useActiveListingChat((s) => s.openBooking);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      setMessages([
        {
          id: nextId(),
          from: "bot",
          text: `Hi 👋 I can help with questions about ${business.name}.`,
        },
        { id: nextId(), from: "bot", text: "Here's what I can do:" },
      ]);
    } else if (messages.length === 0) {
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
  }, [open, business?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  async function replyTo(userText: string) {
    setTyping(true);
    const [replyText] = await Promise.all([
      getChatReply(userText, { vertical, business }),
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);

    setMessages((prev) => [
      ...prev,
      { id: nextId(), from: "bot", text: replyText },
    ]);
    setTyping(false);
  }

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
                    : "rounded-bl-sm border border-gray-100 bg-gray-50 text-gray-700"
                }`}
                style={
                  m.from === "user"
                    ? { backgroundColor: theme.colors.primary }
                    : undefined
                }
              >
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

          {messages.length <= 2 && !typing && (
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
