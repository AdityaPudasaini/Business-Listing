// AuthPage.tsx — shared shell for /login and /signup. Both routes render
// this with a different `initialMode` so the page is correct on first
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthPanel } from "@/components/project/AuthPanel";
import { LoginForm } from "@/components/project/LoginForm";
import { SignupForm } from "@/components/project/SignupForm";

type Mode = "login" | "signup";

interface AuthPageProps {
  initialMode: Mode;
}

const SLIDE_DURATION_MS = 500;

export function AuthPage({ initialMode }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const router = useRouter();

  function switchTo(next: Mode) {
    setMode(next);
    setTimeout(() => {
      router.replace(next === "login" ? "/login" : "/signup");
    }, SLIDE_DURATION_MS);
  }

  const isLogin = mode === "login";

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 px-4 pt-24 pb-10">
      {/* ---------- Desktop: rounded card, sliding panel ---------- */}
      <div className="hidden lg:block w-full max-w-[1140px] bg-white rounded-[28px] p-4 shadow-xl ring-1 ring-black/5">
        <div className="relative h-[680px] overflow-hidden rounded-2xl">
          {/* Branded image panel — the only piece that actually slides */}
          <div
            className="absolute top-0 h-full transition-[left,width] duration-500 ease-in-out"
            style={{
              left: isLogin ? "58%" : "0%",
              width: isLogin ? "42%" : "54%",
            }}
          >
            <AuthPanel />
          </div>

          {/* Signup form — fixed slot on the right, crossfades */}
          <div
            className={`absolute top-0 h-full flex items-center left-[58%] w-[42%] px-8 xl:px-10 transition-opacity duration-500 ${
              isLogin ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            <div className="w-full">
              <SignupForm onSwitchToLogin={() => switchTo("login")} />
            </div>
          </div>

          {/* Login form — fixed slot on the left (image's default spot), crossfades */}
          <div
            className={`absolute top-0 h-full flex items-center left-0 w-[54%] px-12 xl:px-16 transition-opacity duration-500 ${
              isLogin ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="w-full max-w-md mx-auto">
              <LoginForm onSwitchToSignup={() => switchTo("signup")} />
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Mobile / tablet: simple sliding form track, no side panel ---------- */}
      <div className="lg:hidden w-full max-w-md">
        <div className="overflow-hidden">
          <div
            className="flex w-[200%] transition-transform duration-500 ease-in-out"
            style={{
              transform: isLogin ? "translateX(0%)" : "translateX(-50%)",
            }}
          >
            <div className="w-1/2 shrink-0 pr-2">
              <LoginForm onSwitchToSignup={() => switchTo("signup")} />
            </div>
            <div className="w-1/2 shrink-0 pl-2">
              <SignupForm onSwitchToLogin={() => switchTo("login")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
