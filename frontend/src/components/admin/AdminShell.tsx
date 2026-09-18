"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  Layers3,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { theme } from "@/config/theme";
import { useSubmissionsStore } from "@/features/admin/useSubmissionsStore";

const navigation = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/listings", label: "Listings", icon: Layers3 },
  { href: "/admin/review", label: "Review queue", icon: ClipboardCheck },
  { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const pendingCount = useSubmissionsStore(
    (state) =>
      state.submissions.filter((listing) => listing.status === "pending")
        .length,
  );

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-[#f7f7f9] lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="border-b border-gray-200 bg-white px-5 py-6 shadow-sm lg:min-h-screen lg:border-b-0 lg:border-r">
        <Link href="/admin" className="flex items-center gap-3 px-2">
          <span
            style={{ backgroundColor: theme.colors.primary }}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md"
          >
            <ShieldCheck size={21} />
          </span>

          <span>
            <span className="block text-xl font-extrabold text-gray-950">
              AutoHub
            </span>
            <span className="block text-xs font-medium text-gray-500">
              Administration
            </span>
          </span>
        </Link>

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

          <button
            type="button"
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-red-50 hover:text-[#B11226]"
          >
            <Settings size={18} />
            Settings
          </button>
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

        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <span
            style={{ backgroundColor: theme.colors.primary }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold text-white"
          >
            AK
          </span>

          <span>
            <span className="block text-sm font-bold text-gray-900">Admin</span>
            <span className="block text-xs text-gray-500">Administrator</span>
          </span>
        </div>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
