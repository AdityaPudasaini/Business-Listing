"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { AuthCard } from "@/components/project/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { resendVerificationEmail, verifyEmail } from "@/services/api";

type Status = "reading" | "missing" | "checking" | "success" | "error";

export function VerifyEmailPage() {
  const [status, setStatus] = useState<Status>("reading");
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const [resendError, setResendError] = useState("");
  // The link is single-use, and React runs effects twice in development: only try once.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    if (!token) {
      setStatus("missing");
      return;
    }

    // Remove the token from the address bar and history straight away, so it can't leak
    // through the Referer header, browser history or a screenshot.
    window.history.replaceState(null, "", window.location.pathname);

    setStatus("checking");
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((reason) => {
        setErrorMessage(
          reason instanceof Error
            ? reason.message
            : "This verification link is invalid or has expired.",
        );
        setStatus("error");
      });
  }, []);

  async function resend(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setResendState("sending");
    setResendError("");
    try {
      await resendVerificationEmail(email.trim());
      setResendState("sent");
    } catch (reason) {
      setResendState("idle");
      setResendError(
        reason instanceof Error ? reason.message : "Could not send the email. Please try again.",
      );
    }
  }

  if (status === "reading" || status === "checking") {
    return (
      <AuthCard title="Confirming your email" subtitle="One moment…">
        {null}
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard title="Email confirmed">
        <CheckCircle2 className="text-primary" size={44} />

        <p className="mt-4 text-sm text-gray-600">
          Thanks, your email address is confirmed. You can log in now.
        </p>

        <Link
          href="/login"
          className="mt-6 inline-flex rounded-md px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 bg-primary"
        >
          Go to log in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Link not valid"
      subtitle={
        status === "missing"
          ? "This confirmation link is missing or incomplete."
          : errorMessage
      }
    >
      {resendState === "sent" ? (
        <p role="status" className="text-sm text-green-700">
          If that account still needs confirming, a new link is on its way.
        </p>
      ) : (
        <form onSubmit={resend} className="space-y-4">
          <p className="text-sm text-gray-600">Enter your email and we&apos;ll send a new link.</p>
          <Input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button
            type="submit"
            label={resendState === "sending" ? "Sending..." : "Send a new link"}
            disabled={resendState === "sending" || !email.trim()}
            className="w-full justify-center py-3"
          />
          {resendError && (
            <p role="alert" className="text-sm text-red-600">
              {resendError}
            </p>
          )}
        </form>
      )}
    </AuthCard>
  );
}
