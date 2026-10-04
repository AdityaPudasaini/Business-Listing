"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChatWidget } from "@/components/project/ChatWidget";
import { PageTransition } from "@/components/layout/PageTransition";
import { IntroScreen } from "@/components/layout/IntroScreen";
import { AdPopup } from "@/components/layout/AdPopup";
import { CookieConsent } from "@/components/layout/CookieConsent";

const SPLASH_DURATION_MS = 2200; // must match IntroScreen.tsx's own SPLASH_DURATION_MS
const INTRO_SEEN_KEY = "intro-seen";

// "pending" until the browser has checked whether this is a first visit. The
// server never renders the splash, so crawlers and Lighthouse get the real page
// (no full-screen overlay hurting LCP) and returning visitors never see it.
type IntroState = "pending" | "showing" | "done";

// Remembers that the splash already played in this browser session (sessionStorage
// resets when the tab/window is closed). Returns true only the first time per
// session, so the splash plays again on each new visit but not on every page
// or reload. If storage is blocked we skip it, so nobody is stuck seeing the
// splash repeatedly.
function isFirstVisit(): boolean {
  try {
    if (window.sessionStorage.getItem(INTRO_SEEN_KEY)) return false;
    window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  const [intro, setIntro] = useState<IntroState>("pending");
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Always record the visit, but only play the splash on the home page: a
    // visitor who lands on a listing or category page from Google should get
    // the content straight away, not a 2-second overlay.
    const firstVisit = isFirstVisit();
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (
      !firstVisit ||
      prefersReducedMotion ||
      window.location.pathname !== "/"
    ) {
      setIntro("done");
      return;
    }

    setIntro("showing");
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

  const introFinished = intro === "done";

  return (
    <>
      {content}
      {/* Both wait until the splash decision is made. Popup: home page only. */}
      <AdPopup enabled={introFinished && pathname === "/"} />
      <CookieConsent enabled={introFinished && !isAdmin} />
      {intro === "showing" && (
        <IntroScreen
          leaving={leaving}
          onExitComplete={() => setIntro("done")}
        />
      )}
    </>
  );
}
