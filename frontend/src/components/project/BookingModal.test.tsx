import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import type { Business } from "@/types";

vi.mock("@/services/api", () => ({
  ApiError: class ApiError extends Error {},
  createBooking: vi.fn(),
  isBackendConfigured: true,
  assertDemoMode: vi.fn(),
}));

import { BookingModal } from "@/components/project/BookingModal";

const business: Business = {
  id: "b1",
  slug: "kathmandu-auto-care",
  name: "Kathmandu Auto Care",
  image: "/placeholder.jpg",
  category: "servicing",
  location: "Baneshwor, Kathmandu",
};

describe("BookingModal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("closes once even when Escape is pressed twice", () => {
    const onClose = vi.fn();
    render(<BookingModal business={business} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.keyDown(window, { key: "Escape" });
    act(() => {
      vi.runAllTimers();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks page scrolling while open and restores it on unmount", () => {
    document.body.style.overflow = "auto";
    const { unmount } = render(
      <BookingModal business={business} onClose={vi.fn()} />,
    );

    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });
});
