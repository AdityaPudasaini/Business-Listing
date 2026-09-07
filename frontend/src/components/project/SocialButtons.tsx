"use client";

import { theme } from "@/config/theme";

const secondary = theme.colors.secondary;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      width="16"
      height="18"
      viewBox="0 0 16 18"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13.06 9.55c-.02-2.03 1.66-3.01 1.73-3.05-.95-1.38-2.42-1.57-2.94-1.59-1.25-.13-2.45.74-3.08.74-.64 0-1.61-.72-2.65-.7-1.36.02-2.63.79-3.33 2.01-1.42 2.46-.36 6.1 1.02 8.1.68.98 1.48 2.08 2.53 2.04 1.02-.04 1.4-.65 2.63-.65 1.22 0 1.57.65 2.64.63 1.09-.02 1.78-.99 2.44-1.98.77-1.14 1.09-2.24 1.11-2.3-.02-.01-2.13-.82-2.15-3.25Z" />
      <path d="M11.09 3.48c.55-.67.92-1.6.82-2.53-.79.03-1.75.53-2.32 1.19-.51.59-.96 1.54-.84 2.44.88.07 1.79-.44 2.34-1.1Z" />
    </svg>
  );
}

export function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Google */}
      <button
        type="button"
        onClick={() => {}}
        style={{
          backgroundColor: "#ffffff",
          borderColor: "#d9d9d9",
          color: secondary,
        }}
        className="
          flex items-center justify-center gap-2
          border rounded-xl
          py-3
          text-sm font-medium
          transition-colors duration-200
          hover:bg-gray-50
          hover:border-gray-300
        "
      >
        <GoogleIcon />
        Google
      </button>

      {/* Apple */}
      <button
        type="button"
        onClick={() => {}}
        style={{
          backgroundColor: "#ffffff",
          borderColor: "#d9d9d9",
          color: secondary,
        }}
        className="
          flex items-center justify-center gap-2
          border rounded-xl
          py-3
          text-sm font-medium
          transition-colors duration-200
          hover:bg-gray-50
          hover:border-gray-300
        "
      >
        <AppleIcon />
        Apple
      </button>
    </div>
  );
}
