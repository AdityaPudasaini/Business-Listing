"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  Layers3,
  ListTree,
  LoaderCircle,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { theme } from "@/config/theme";
import { getActiveVertical } from "@/features/verticals";
import { useDemoAuthStore } from "@/features/auth/useDemoAuthStore";
import { getAdminListings, isBackendConfigured } from "@/services/api";

const navigation = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/listings", label: "Listings", icon: Layers3 },
  { href: "/admin/review", label: "Review queue", icon: ClipboardCheck },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: ListTree },
  { href: "/admin/chats", label: "Chats", icon: MessageCircle },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const vertical = getActiveVertical();

  const user = useDemoAuthStore((state) => state.user);
  const hasHydrated = useDemoAuthStore((state) => state.hasHydrated);
  const signOut = useDemoAuthStore((state) => state.signOut);

  const [pendingCount, setPendingCount] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isLoginPage && hasHydrated && !isAdmin) {
      router.replace("/admin/login");
    }
  }, [hasHydrated, isAdmin, isLoginPage, router]);

  // Close the mobile drawer on every navigation instead of leaving it open
  // over the new page.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isAdmin || !isBackendConfigured) return;
    getAdminListings()
      .then((listings) =>
        setPendingCount(
          listings.filter((listing) => listing.status === "pending").length,
        ),
      )
      .catch(() => setPendingCount(0));
  }, [isAdmin, pathname]);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  function handleLogout() {
    signOut();
    router.push("/");
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!hasHydrated || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-sm font-semibold text-gray-500">
          <LoaderCircle size={20} className="animate-spin" />
          Checking administrator access...
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f9] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Mobile top bar — the sidebar itself is hidden below lg (see aside
          below); this is the only thing visible on small screens until the
          drawer is opened. */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span
            style={{ backgroundColor: theme.colors.primary }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-md"
          >
            <ShieldCheck size={18} />
          </span>
          <span className="text-base font-extrabold text-gray-950">
            {vertical.brandName}
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-700"
        >
          <Menu size={19} />
        </button>
      </div>

      {/* Backdrop, mobile only — closes the drawer on tap outside it. */}
      {navOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[280px] transform overflow-y-auto border-r border-gray-200 bg-white px-5 py-6 shadow-sm transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:min-h-screen lg:w-auto lg:translate-x-0 lg:shadow-none ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <Link href="/admin" className="flex items-center gap-3">
            <span
              style={{ backgroundColor: theme.colors.primary }}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md"
            >
              <ShieldCheck size={21} />
            </span>

            <span>
              <span className="block text-xl font-extrabold text-gray-950">
                {vertical.brandName}
              </span>

              <span className="block text-xs font-medium text-gray-500">
                Administration
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="mt-10 space-y-2">
          <p className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            Administration
          </p>

          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                style={active ? { backgroundColor: theme.colors.primary } : {}}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  active
                    ? "text-white shadow-md"
                    : "text-gray-700 hover:bg-red-50 hover:text-[#B11226]"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>

                {item.href === "/admin/review" && pendingCount > 0 && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-xs ${
                      active
                        ? "bg-white/25 text-white"
                        : "bg-red-50 text-[#B11226]"
                    }`}
                  >
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-10 rounded-2xl border border-red-100 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} style={{ color: theme.colors.primary }} />
            <p className="text-sm font-bold text-gray-900">Review mode</p>
          </div>

          <p className="mt-2 text-xs leading-5 text-gray-600">
            Check every submitted field before publishing a listing.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span
              style={{ backgroundColor: theme.colors.primary }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold text-white"
            >
              AD
            </span>

            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-gray-900">
                {user.name}
              </span>

              <span className="block text-xs text-gray-500">Administrator</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-red-50 hover:text-[#B11226]"
          >
            <LogOut size={15} />
            Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
