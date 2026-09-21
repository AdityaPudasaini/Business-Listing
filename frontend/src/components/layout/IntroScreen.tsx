// IntroScreen.tsx — the pre-open splash overlay. Rendered by AppChrome.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { theme } from "@/config/theme";
import { getActiveVertical } from "@/features/verticals";

interface IntroScreenProps {
  leaving: boolean;
  onExitComplete: () => void;
}

const SPLASH_DURATION_MS = 2200;
const EXIT_DURATION_MS = 600;
const LETTER_STAGGER_MS = 40;

export function IntroScreen({ leaving, onExitComplete }: IntroScreenProps) {
  const vertical = getActiveVertical();
  const brandName = vertical.brandName;
  const BrandIcon = vertical.icon;

  const [percent, setPercent] = useState(0);
  const [complete, setComplete] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    const start = performance.now();
    let frame: number;

    function tick(now: number) {
      const elapsed = now - start;

      const pct = Math.min(
        100,
        Math.round((elapsed / (SPLASH_DURATION_MS - 250)) * 100),
      );

      setPercent(pct);

      if (pct >= 100 && !completedRef.current) {
        completedRef.current = true;
        setComplete(true);
      }

      if (pct < 100) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!leaving) return;

    const timeout = setTimeout(onExitComplete, EXIT_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [leaving, onExitComplete]);

  return (
    <div
      style={{
        ["--intro-primary" as string]: theme.colors.primary,
        ["--intro-primary-soft" as string]: `${theme.colors.primary}33`,
        ["--intro-primary-faint" as string]: `${theme.colors.primary}1A`,
        ["--intro-primary-glow" as string]: `${theme.colors.primary}55`,
      }}
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-white ${
        leaving ? "animate-intro-exit" : ""
      }`}
    >
      <div className="absolute h-[560px] w-[560px] rounded-full bg-[var(--intro-primary-soft)] opacity-0 blur-2xl animate-intro-glow" />

      {/* Faint dot-grid — pure background texture, adds depth without competing with the foreground animation */}
      <div
        style={{
          backgroundImage: `radial-gradient(var(--intro-primary-faint) 1px, transparent 1px)`,
          backgroundSize: "26px 26px",
        }}
        className="absolute inset-0 opacity-0 animate-intro-dotgrid pointer-events-none"
      />

      {/* Outer ring pulse — ripples once, right as the loading ring completes */}
      {complete && (
        <div className="absolute h-[300px] w-[300px] rounded-full border border-[var(--intro-primary)] animate-intro-outer-ring pointer-events-none" />
      )}

      {/* Icon echoes — small faint copies of the brand icon, gently bobbing
          near the top corners, so the top isn't just empty space. */}
      <div
        style={{ animationDelay: "0.4s" }}
        className="absolute left-[14%] top-[10%] flex h-11 w-11 items-center justify-center rounded-full bg-[var(--intro-primary-faint)] text-[var(--intro-primary)] opacity-0 animate-intro-icon-echo"
      >
        <BrandIcon size={18} />
      </div>
      <div
        style={{ animationDelay: "1.3s" }}
        className="absolute right-[16%] top-[16%] flex h-8 w-8 items-center justify-center rounded-full bg-[var(--intro-primary-faint)] text-[var(--intro-primary)] opacity-0 animate-intro-icon-echo"
      >
        <BrandIcon size={14} />
      </div>

      {[
        {
          left: "10%",
          drift: "32px",
          duration: "7s",
          delay: "0.2s",
          size: "22px",
          shape: "circle",
        },
        {
          left: "22%",
          drift: "-22px",
          duration: "8.4s",
          delay: "1.6s",
          size: "14px",
          shape: "square",
        },
        {
          left: "78%",
          drift: "-32px",
          duration: "7.6s",
          delay: "0.7s",
          size: "22px",
          shape: "circle",
        },
        {
          left: "88%",
          drift: "18px",
          duration: "9.4s",
          delay: "2.2s",
          size: "14px",
          shape: "square",
        },
        {
          left: "50%",
          drift: "12px",
          duration: "6.6s",
          delay: "1.1s",
          size: "16px",
          shape: "circle",
        },
        {
          left: "35%",
          drift: "-16px",
          duration: "8.8s",
          delay: "0.5s",
          size: "12px",
          shape: "square",
        },
        {
          left: "64%",
          drift: "24px",
          duration: "7.2s",
          delay: "1.9s",
          size: "18px",
          shape: "circle",
        },
        {
          left: "5%",
          drift: "20px",
          duration: "9.8s",
          delay: "2.6s",
          size: "12px",
          shape: "square",
        },
      ].map((p, i) => (
        <span
          key={i}
          style={{
            left: p.left,
            bottom: "-60px",
            width: p.size,
            height: p.size,
            ["--drift" as string]: p.drift,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
          className="absolute text-[var(--intro-primary)] opacity-0 animate-intro-particle"
        >
          {p.shape === "circle" ? (
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-full w-full drop-shadow-sm"
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
          ) : (
            <span className="block h-full w-full rotate-45 rounded-[3px] bg-current drop-shadow-sm" />
          )}
        </span>
      ))}

      {[
        { top: "20%", left: "30%", delay: "0.3s" },
        { top: "65%", left: "78%", delay: "1.2s" },
        { top: "30%", left: "70%", delay: "2s" },
        { top: "72%", left: "26%", delay: "1.6s" },
        { top: "14%", left: "58%", delay: "0.8s" },
        { top: "82%", left: "50%", delay: "2.3s" },
        { top: "48%", left: "12%", delay: "1.4s" },
        { top: "5%", left: "45%", delay: "0.5s" },
        { top: "8%", left: "20%", delay: "1.8s" },
      ].map((s, i) => (
        <span
          key={i}
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          className="absolute text-[var(--intro-primary)] opacity-0 animate-intro-sparkle"
        >
          ✦
        </span>
      ))}

      <div className="relative z-[2] flex flex-col items-center opacity-0 translate-y-2.5 animate-intro-stage">
        <div className="relative flex h-[260px] w-[260px] items-center justify-center">
          <div className="absolute inset-[22px] rounded-full border border-dashed border-[var(--intro-primary-soft)] opacity-0 animate-intro-orbit-dashed" />

          <div className="absolute inset-[52px] rounded-full bg-[var(--intro-primary-faint)] opacity-0 animate-intro-halo" />

          <div
            style={{
              background: `conic-gradient(var(--intro-primary) ${percent}%, transparent 0%)`,
            }}
            className={`absolute inset-[38px] rounded-full opacity-0 [mask:radial-gradient(farthest-side,transparent_calc(100%-4px),#000_calc(100%-4px))] animate-intro-progress-ring ${
              complete ? "animate-intro-ring-complete" : ""
            }`}
          />

          <div className="absolute inset-0 animate-intro-chip-ring">
            {[0, 90, 180, 270].map((deg, i) => (
              <div
                key={deg}
                style={{
                  transform: `rotate(${deg}deg) translate(100px) rotate(${-deg}deg)`,
                  animationDelay: `${0.55 + i * 0.08}s`,
                }}
                className="absolute left-1/2 top-1/2 h-[30px] w-[30px] -m-[15px] rounded-full border border-[var(--intro-primary-soft)] bg-[var(--intro-primary-faint)] opacity-0 shadow-sm flex items-center justify-center text-[var(--intro-primary)] animate-intro-chip"
              >
                <div className="animate-intro-chip-counter">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-3.5 w-3.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute -inset-[34px] animate-intro-chip-ring-outer">
            {[30, 150, 270].map((deg, i) => (
              <div
                key={deg}
                style={{
                  transform: `rotate(${deg}deg) translate(150px) rotate(${-deg}deg)`,
                  animationDelay: `${0.87 + i * 0.08}s`,
                }}
                className="absolute left-1/2 top-1/2 h-[30px] w-[30px] -m-[15px] rounded-full border border-[var(--intro-primary-soft)] bg-[var(--intro-primary-faint)] opacity-0 shadow-sm flex items-center justify-center text-[var(--intro-primary)] animate-intro-chip"
              >
                <div className="animate-intro-chip-counter-outer">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="h-3.5 w-3.5"
                  >
                    <path d="m21 21-4.3-4.3" />
                    <circle cx="11" cy="11" r="8" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          <div
            className={`relative z-[3] flex h-[76px] w-[76px] items-center justify-center rounded-2xl text-white shadow-lg scale-0 animate-intro-tile ${
              complete ? "animate-intro-tile-complete" : ""
            }`}
            style={{
              background: `linear-gradient(155deg,var(--intro-primary),var(--intro-primary))`,
            }}
          >
            <BrandIcon size={34} />
          </div>
        </div>

        <div className="mt-8 flex text-3xl font-extrabold tracking-wide">
          {brandName.split("").map((char, i) => (
            <span
              key={i}
              style={{ animationDelay: `${240 + i * LETTER_STAGGER_MS}ms` }}
              className="inline-block opacity-0 translate-y-4 rotate-[10deg] scale-90 animate-intro-letter"
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </div>

        <div
          style={{
            backgroundColor: theme.colors.primary,
            animationDelay: "600ms",
          }}
          className="mt-1.5 h-[3px] w-16 rounded-full scale-x-0 animate-intro-underline"
        />

        <p
          style={{ animationDelay: "700ms" }}
          className="mt-2 text-sm text-gray-500 opacity-0 animate-intro-fade"
        >
          Trusted businesses, found in seconds
        </p>

        <p
          style={{ animationDelay: "740ms" }}
          className="mt-1 text-xs font-medium text-gray-400 opacity-0 animate-intro-fade"
        >
          {complete
            ? "Welcome!"
            : percent < 40
              ? "Finding trusted businesses..."
              : percent < 90
                ? "Almost ready..."
                : "Just a moment more..."}
        </p>

        <p
          style={{ animationDelay: "780ms" }}
          className={`mt-2 text-sm font-bold text-[var(--intro-primary)] opacity-0 animate-intro-fade transition-transform duration-200 ${
            complete ? "animate-intro-counter-complete" : ""
          }`}
        >
          {percent}%
        </p>
      </div>
    </div>
  );
}
