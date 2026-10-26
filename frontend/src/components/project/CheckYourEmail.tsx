// CheckYourEmail.tsx -- shown after signup (or a blocked login) when the account's email
// still has to be confirmed. Lets the person ask for a fresh link.
"use client";

import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { resendVerificationEmail } from "@/services/api";

const RESEND_COOLDOWN_SECONDS = 30;

interface CheckYourEmailProps {
  email: string;
  heading?: string;
  onBack: () => void;
}

export function CheckYourEmail({
  email,
  heading = "Check your email",
  onBack,
}: CheckYourEmailProps) {
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function resend() {
    setMessage("");
    setError("");
    try {
      await resendVerificationEmail(email);
      setMessage("A new link is on its way. Check your spam folder too.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not send the email. Please try again.",
      );
    }
  }

  return (
    <div>
      <MailCheck className="text-primary" size={44} />

      <h1 className="mt-4 text-2xl font-extrabold md:text-3xl text-secondary">{heading}</h1>

      <p className="mt-2 text-sm text-secondary/60">
        We sent a confirmation link to <span className="font-semibold">{email}</span>. Click it to
        activate your account, then log in. The link works for 24 hours.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 text-primary"
        >
          {cooldown > 0 ? `Send again in ${cooldown}s` : "Send the email again"}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="font-semibold text-secondary/60 transition-opacity hover:opacity-80"
        >
          Back
        </button>
      </div>

      {message && (
        <p role="status" className="mt-3 text-sm text-green-700">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
