"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getActiveVertical } from "@/features/verticals";
import { logout as clearAccessToken } from "@/services/api";

export type DemoUserRole = "owner" | "admin";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: DemoUserRole;
}

interface DemoAuthState {
  user: DemoUser | null;
  hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;

  setAuthenticatedUser: (user: {
    id: string;
    name: string;
    email: string;
    role: string;
  }) => void;

  signIn: (email: string) => void;

  signUp: (values: {
    firstName: string;
    lastName: string;
    email: string;
  }) => void;

  signInAdmin: () => void;

  signOut: () => void;
}

function nameFromEmail(email: string) {
  const beforeAt = email.split("@")[0] || "Business owner";

  return beforeAt
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const useDemoAuthStore = create<DemoAuthState>()(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,

      setHasHydrated: (value) => {
        set({ hasHydrated: value });
      },

      setAuthenticatedUser: (user) => {
        set({
          user: {
            id: user.id,
            name: user.name || nameFromEmail(user.email),
            email: user.email.toLowerCase(),
            role: user.role === "admin" ? "admin" : "owner",
          },
        });
      },

      signIn: (email) => {
        set({
          user: {
            id: `demo-${email.toLowerCase()}`,
            name: nameFromEmail(email),
            email: email.toLowerCase(),
            role: "owner",
          },
        });
      },

      signUp: ({ firstName, lastName, email }) => {
        set({
          user: {
            id: `demo-${Date.now()}`,
            name: `${firstName.trim()} ${lastName.trim()}`,
            email: email.trim().toLowerCase(),
            role: "owner",
          },
        });
      },

      signInAdmin: () => {
        set({
          user: {
            id: "demo-admin",
            name: "Admin",
            email: `admin@${getActiveVertical().brandName.toLowerCase()}.com`,
            role: "admin",
          },
        });
      },

      signOut: () => {
        // Clearing `user` alone only updates what the UI shows — the real
        // JWT stays valid in storage until it expires (up to 7 days) unless
        // it's explicitly removed here too.
        clearAccessToken();
        set({ user: null });
      },
    }),
    {
      name: `${getActiveVertical().brandName.toLowerCase()}-demo-auth-v1`,

      partialize: (state) => ({
        user: state.user,
      }),

      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);