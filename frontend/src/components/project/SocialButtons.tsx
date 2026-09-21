"use client";

import { useState } from "react";
import { theme } from "@/config/theme";
import { startSocialLogin, type SocialProvider } from "@/services/api";

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

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z"
      />
    </svg>
  );
}

const providers: {
  id: SocialProvider;
  label: string;
  icon: () => JSX.Element;
}[] = [
  { id: "google", label: "Google", icon: GoogleIcon },
  { id: "facebook", label: "Facebook", icon: FacebookIcon },
];

export function SocialButtons() {
  const [error, setError] = useState("");

  function handleClick(provider: SocialProvider) {
    setError("");
    try {
      // Navigates away to the provider; only returns here if it throws.
      startSocialLogin(provider);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start social login.",
      );
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {providers.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleClick(id)}
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
            <Icon />
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
