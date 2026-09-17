// useActiveListingChat.ts
import { create } from "zustand";
import { Business } from "@/types";

interface ActiveListingChatState {
  business: Business | null;
  openBooking: (() => void) | null;
  setActiveListing: (business: Business, openBooking: () => void) => void;
  clearActiveListing: () => void;
}

export const useActiveListingChat = create<ActiveListingChatState>((set) => ({
  business: null,
  openBooking: null,
  setActiveListing: (business, openBooking) => set({ business, openBooking }),
  clearActiveListing: () => set({ business: null, openBooking: null }),
}));