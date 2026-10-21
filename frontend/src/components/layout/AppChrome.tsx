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

// Whether the splash already played in this browser session (sessionStorage
// resets when the tab/window is closed). The visit is marked only once the
// splash has FINISHED (or was skipped), not when it starts: in development
// React runs effects twice, and marking at the start made the second run think
// the splash was already seen and cancel it, so it never played in `npm run dev`.
// If storage is blocked we treat it as seen so nobody is stuck with the splash.
function hasSeenIntro(): boolean {
  try {
    return Boolean(window.sessionStorage.getItem(INTRO_SEEN_KEY));
  } catch {
    return true;
  }
}

function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    /* storage blocked: nothing to remember */
  }
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  const [intro, setIntro] = useState<IntroState>("pending");
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Only play the splash on the home page: a visitor who lands on a listing
    // or category page from Google should get the content straight away. Such
    // a visit still counts as "seen", so the splash doesn't appear later.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (
      hasSeenIntro() ||
      prefersReducedMotion ||
      window.location.pathname !== "/"
    ) {
      markIntroSeen();
      setIntro("done");
      return;
    }

    setIntro("showing");
    const timer = setTimeout(() => setLeaving(true), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  // Once the decision is made the splash itself (or the page, if skipped) is
  // on screen, so the instant cover set by the <head> script can go.
  useEffect(() => {
    if (intro !== "pending") {
      document.documentElement.removeAttribute("data-intro");
    }
  }, [intro]);

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
          onExitComplete={() => {
            markIntroSeen();
            setIntro("done");
          }}
        />
      )}
    </>
  );
}
