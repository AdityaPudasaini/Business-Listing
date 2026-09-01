"use client";
// Navbar.tsx — the site header, shown on every page via layout.tsx. Reads the brand name from theme.ts so it never needs to change per client.
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { theme } from "@/config/theme";
import { Button } from "@/components/ui/Button";
import { LogIn, UserPlus, Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="fixed top-0 inset-x-0 z-20 px-1.5 sm:px-2 md:px-3 pt-1 sm:pt-1.5">
      <header className="rounded-2xl shadow-md shadow-black/5 border border-black/5 bg-white/80 backdrop-blur-xl overflow-hidden">
        <div className="flex md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 md:px-10 py-3.5 sm:py-3">
          <Link href="/" className="flex items-center gap-2 justify-self-start">
            {theme.logoUrl ? (
              <Image
                src={theme.logoUrl}
                alt={theme.brandName}
                width={32}
                height={32}
                className="h-8 w-auto"
              />
            ) : null}
            <span className="font-bold text-lg sm:text-xl text-gray-900">
              {theme.brandName}
            </span>
          </Link>

          <nav className="hidden md:flex gap-16 text-base font-semibold justify-self-center">
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
                    className={`absolute left-0 -bottom-0.5 h-0.5 w-full origin-left transition-transform duration-300 ease-out group-hover:scale-x-100 ${
                      isActive ? "scale-x-100" : "scale-x-0"
                    }`}
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-3 justify-self-end">
            <Button
              label="Sign Up"
              icon={<UserPlus size={16} />}
              variant="secondary"
              className="justify-center w-[120px]"
              onClick={() => (window.location.href = "/signup")}
            />
            <Button
              label="Login"
              icon={<LogIn size={16} />}
              variant="secondary"
              className="justify-center w-[120px]"
              onClick={() => (window.location.href = "/login")}
            />
          </div>

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="md:hidden ml-auto p-2 text-gray-800 relative h-6 w-6"
          >
            <Menu
              size={24}
              className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                mobileOpen
                  ? "rotate-90 opacity-0 scale-75"
                  : "rotate-0 opacity-100 scale-100"
              }`}
            />
            <X
              size={24}
              className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                mobileOpen
                  ? "rotate-0 opacity-100 scale-100"
                  : "-rotate-90 opacity-0 scale-75"
              }`}
            />
          </button>
        </div>

        {/* Mobile menu panel — always mounted (not conditionally rendered) so the
            grid-rows trick below can animate its height smoothly on open/close,
            instead of the panel just popping in and out instantly. */}
        <div
          className={`md:hidden grid transition-all duration-300 ease-in-out ${
            mobileOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t px-4 sm:px-6 py-4 flex flex-col gap-4 bg-white">
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

              <div className="flex flex-col gap-2 pt-2 border-t">
                <Button
                  label="Sign Up"
                  icon={<UserPlus size={16} />}
                  variant="secondary"
                  className="justify-center w-full"
                  onClick={() => (window.location.href = "/signup")}
                />
                <Button
                  label="Login"
                  icon={<LogIn size={16} />}
                  variant="secondary"
                  className="justify-center w-full"
                  onClick={() => (window.location.href = "/login")}
                />
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
