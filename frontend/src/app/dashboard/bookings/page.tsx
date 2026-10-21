import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { BookingRequestsPage } from "@/components/sections/BookingRequestsPage";

export const metadata: Metadata = {
  title: "Booking Requests",
  robots: { index: false, follow: false },
};

export default function BookingRequests() {
  return (
    <RequireAuth>
      <BookingRequestsPage />
    </RequireAuth>
  );
}
