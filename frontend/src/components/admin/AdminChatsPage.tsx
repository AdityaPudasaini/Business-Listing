"use client";

// AdminChatsPage — every visitor chat across every listing. Admins can read
// the logs and reply; replies are labelled "Admin" to the visitor and the
// owner (the backend sets that from the JWT role, not from the client).

import { ChatInbox } from "@/components/sections/ChatInbox";

export function AdminChatsPage() {
  return (
    <div className="px-5 py-8 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
        Administration
      </p>
      <h1 className="mt-1 text-3xl font-extrabold text-gray-950">Chats</h1>
      <p className="mt-2 max-w-2xl text-gray-500">
        All visitor conversations across every listing. Open one to read the
        thread and reply as admin — the listing owner can see your messages too.
      </p>

      <ChatInbox mode="admin" />
    </div>
  );
}
