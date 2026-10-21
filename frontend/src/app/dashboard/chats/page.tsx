import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ChatLogsPage } from "@/components/sections/ChatLogsPage";

export const metadata: Metadata = {
  title: "Chat Logs",
  robots: { index: false, follow: false },
};

export default function DashboardChats() {
  return (
    <RequireAuth>
      <ChatLogsPage />
    </RequireAuth>
  );
}
