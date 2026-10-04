"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getActiveVertical } from "@/features/verticals";
import {
  getSession,
  isBackendConfigured,
  logout as endServerSession,
} from "@/services/api";

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
        // Clearing `user` alone only updates what the UI shows — the session
        // cookie stays valid until the API clears it, so end it there too.
        void endServerSession();
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

// ---------------------------------------------------------------------------
// Keep every open tab in step with the real session.
//
// Who is signed in is cached here (localStorage) but the real session is the
// httpOnly cookie, which every tab of the browser shares. Without the code
// below, a tab keeps showing the old user after another tab signs out or in as
// someone else, until the page is reloaded.
// ---------------------------------------------------------------------------
if (typeof window !== "undefined") {
  const storageKey = useDemoAuthStore.persist.getOptions().name;

  // 1) Another tab signed in, out, or switched user: adopt it immediately.
  window.addEventListener("storage", (event) => {
    if (event.key === storageKey || event.key === null) {
      void useDemoAuthStore.persist.rehydrate();
    }
  });

  // 2) Returning to a tab: check the server still agrees with this tab.
  //    Catches expiry, a ban, a role change, or another account taking over.
  let lastCheck = 0;
  const verifySession = async () => {
    const { user } = useDemoAuthStore.getState();
    if (!user || !isBackendConfigured || user.id.startsWith("demo-")) return;
    if (Date.now() - lastCheck < 5000) return;
    lastCheck = Date.now();

    const session = await getSession();
    if (!session) {
      // No valid session anywhere (expired, banned, signed out): drop the cache.
      useDemoAuthStore.setState({ user: null });
    } else if (session.userId !== user.id) {
      // Someone else is signed in now: take whatever the other tab stored.
      void useDemoAuthStore.persist.rehydrate();
    } else {
      const role = session.role === "admin" ? "admin" : "owner";
      if (role !== user.role) {
        useDemoAuthStore.setState({ user: { ...user, role } });
      }
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void verifySession();
  });
  window.addEventListener("focus", () => void verifySession());
}
