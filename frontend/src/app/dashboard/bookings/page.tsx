import { RequireAuth } from "@/components/auth/RequireAuth";
import { BookingRequestsPage } from "@/components/sections/BookingRequestsPage";

export default function BookingRequests() {
  return (
    <RequireAuth>
      <BookingRequestsPage />
    </RequireAuth>
  );
}
