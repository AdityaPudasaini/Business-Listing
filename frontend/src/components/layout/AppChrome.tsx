"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/project/ChatWidget";
import { PageTransition } from "@/components/layout/PageTransition";
import { IntroScreen } from "@/components/layout/IntroScreen";

const SPLASH_DURATION_MS = 2200; // must match IntroScreen.tsx's own SPLASH_DURATION_MS

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  const [showIntro, setShowIntro] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      setShowIntro(false);
      return;
    }

    const timer = setTimeout(() => setLeaving(true), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  const content = isAdmin ? (
    <PageTransition>{children}</PageTransition>
  ) : (
    <>
      <Navbar />
      <main>
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <ChatWidget />
    </>
  );

  return (
    <>
      {content}
      {showIntro && (
        <IntroScreen
          leaving={leaving}
          onExitComplete={() => setShowIntro(false)}
        />
      )}
    </>
  );
}
