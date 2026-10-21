"use client";

// ChatLogsPage — owner side of the chat widget. Lists every chat session on
// the owner's listings and lets them reply live (see ChatInbox).

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChatInbox } from "@/components/sections/ChatInbox";

export function ChatLogsPage() {
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
          Chat logs
        </h1>
        <p className="mt-2 text-gray-500">
          Conversations visitors had with the chat widget on your listings. Open
          one to jump in and reply — the visitor sees your message in the widget
          within a few seconds.
        </p>

        <ChatInbox mode="owner" />
      </div>
    </main>
  );
}
