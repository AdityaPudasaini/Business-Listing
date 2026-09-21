"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useDemoAuthStore } from "@/features/auth/useDemoAuthStore";
import { getSession, isBackendConfigured } from "@/services/api";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useDemoAuthStore((state) => state.user);
  const hasHydrated = useDemoAuthStore((state) => state.hasHydrated);
  const signOut = useDemoAuthStore((state) => state.signOut);

  useEffect(() => {
    if (hasHydrated && !user) {
      router.replace("/login");
    }
  }, [hasHydrated, user, router]);

  // Confirm the token is still valid. getSession() returns null when there is
  // no token or the API rejects it (a 401 also clears the stored token).
  useEffect(() => {
    if (!hasHydrated || !user || !isBackendConfigured) return;

    let cancelled = false;
    getSession().then((session) => {
      if (!cancelled && !session) signOut();
    });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, user, signOut]);

  if (!hasHydrated || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-semibold text-gray-500">
          <LoaderCircle size={20} className="animate-spin" />
          Checking your session...
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
