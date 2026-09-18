"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { theme } from "@/config/theme";
import { getActiveVertical } from "@/features/verticals";
import { Button } from "@/components/ui/Button";
import { useDemoAuthStore } from "@/features/auth/useDemoAuthStore";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);

  const user = useDemoAuthStore((state) => state.user);
  const signOut = useDemoAuthStore((state) => state.signOut);

  const vertical = getActiveVertical();
  const brandName = vertical.brandName;
  const logoUrl = vertical.logoUrl ?? theme.logoUrl;

  function handleLogout() {
    signOut();
    setMobileOpen(false);
    router.push("/");
  }

  return (
    <div className="fixed inset-x-0 top-0 z-20 px-1.5 pt-1 sm:px-2 sm:pt-1.5 md:px-3">
      <header className="overflow-hidden rounded-2xl border border-black/5 bg-white/80 shadow-md shadow-black/5 backdrop-blur-xl">
        <div className="flex items-center gap-4 px-4 py-3.5 sm:px-6 sm:py-3 md:grid md:grid-cols-[1fr_auto_1fr] md:px-10">
          <Link href="/" className="flex justify-self-start items-center gap-2">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={brandName}
                width={32}
                height={32}
                className="h-8 w-auto"
              />
            ) : null}

            <span className="text-lg font-bold text-gray-900 sm:text-xl">
              {brandName}
            </span>
          </Link>

          <nav className="hidden justify-self-center gap-16 text-base font-semibold md:flex">
            {theme.nav.links.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{ ["--link-hover" as string]: theme.colors.primary }}
                  className={`group relative py-1 transition-colors duration-200 hover:text-[var(--link-hover)] ${
                    isActive ? "text-[var(--link-hover)]" : "text-gray-800"
                  }`}
                >
                  {link.label}

                  <span
                    className={`absolute -bottom-0.5 left-0 h-0.5 w-full origin-left transition-transform duration-300 ease-out group-hover:scale-x-100 ${
                      isActive ? "scale-x-100" : "scale-x-0"
                    }`}
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center justify-self-end gap-3 md:flex">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  style={{
                    borderColor: theme.colors.primary,
                    color: theme.colors.primary,
                  }}
                  className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition hover:bg-red-50"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Button
                  label="Sign Up"
                  icon={<UserPlus size={16} />}
                  variant="secondary"
                  className="w-[120px] justify-center"
                  onClick={() => router.push("/signup")}
                />

                <Button
                  label="Login"
                  icon={<LogIn size={16} />}
                  variant="secondary"
                  className="w-[120px] justify-center"
                  onClick={() => router.push("/login")}
                />
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="relative ml-auto h-6 w-6 p-2 text-gray-800 md:hidden"
          >
            <Menu
              size={24}
              className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                mobileOpen
                  ? "scale-75 rotate-90 opacity-0"
                  : "scale-100 rotate-0 opacity-100"
              }`}
            />

            <X
              size={24}
              className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                mobileOpen
                  ? "scale-100 rotate-0 opacity-100"
                  : "scale-75 -rotate-90 opacity-0"
              }`}
            />
          </button>
        </div>

        <div
          className={`grid transition-all duration-300 ease-in-out md:hidden ${
            mobileOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-4 border-t bg-white px-4 py-4 sm:px-6">
              <nav className="flex flex-col gap-3 text-base font-semibold">
                {theme.nav.links.map((link) => {
                  const isActive = pathname === link.href;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      style={{
                        ["--link-hover" as string]: theme.colors.primary,
                      }}
                      className={`py-1 transition-colors duration-200 hover:text-[var(--link-hover)] ${
                        isActive ? "text-[var(--link-hover)]" : "text-gray-800"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="flex flex-col gap-2 border-t pt-2">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      style={{
                        borderColor: theme.colors.primary,
                        color: theme.colors.primary,
                      }}
                      className="flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold"
                    >
                      <UserRound size={16} />
                      Dashboard — {user.name}
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 rounded-md bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700"
                    >
                      <LogOut size={16} />
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Button
                      label="Sign Up"
                      icon={<UserPlus size={16} />}
                      variant="secondary"
                      className="w-full justify-center"
                      onClick={() => {
                        setMobileOpen(false);
                        router.push("/signup");
                      }}
                    />

                    <Button
                      label="Login"
                      icon={<LogIn size={16} />}
                      variant="secondary"
                      className="w-full justify-center"
                      onClick={() => {
                        setMobileOpen(false);
                        router.push("/login");
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
