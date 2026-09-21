"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { AuthCard } from "@/components/project/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { theme } from "@/config/theme";
import { forgotPasswordSchema } from "@/lib/validation/account";
import { requestPasswordReset } from "@/services/api";
import type { z } from "zod";

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setSubmitError("");

    try {
      await requestPasswordReset(values.email);
      setSentTo(values.email);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to send the reset link. Please try again.",
      );
    }
  }

  if (sentTo) {
    return (
      <AuthCard title="Check your email">
        <MailCheck size={44} style={{ color: theme.colors.primary }} />

        {/* Same wording whether or not the account exists — the API doesn't say either. */}
        <p className="mt-4 text-sm text-gray-600">
          If an account exists for <strong>{sentTo}</strong>, we&apos;ve sent a
          link to choose a new password. It expires in 30 minutes.
        </p>

        <p className="mt-3 text-sm text-gray-500">
          Nothing after a few minutes? Check your spam folder, or try again.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button
            label="Try a different email"
            variant="secondary"
            onClick={() => {
              reset();
              setSentTo(null);
            }}
          />

          <Link
            href="/login"
            className="text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: theme.colors.primary }}
          >
            Back to log in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter the email you signed up with and we'll send you a link to choose a new one."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <div className={errors.email ? "rounded-xl ring-1 ring-red-500" : ""}>
            <Input
              type="email"
              placeholder="Email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </div>

          {errors.email && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          label={isSubmitting ? "Sending..." : "Send reset link"}
          disabled={isSubmitting}
          className="w-full justify-center py-3"
        />

        {submitError && (
          <p role="alert" className="text-sm text-red-600">
            {submitError}
          </p>
        )}
      </form>

      <p className="mt-6 text-sm" style={{ color: theme.colors.secondary }}>
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-semibold transition-opacity hover:opacity-80"
          style={{ color: theme.colors.primary }}
        >
          Back to log in
        </Link>
      </p>
    </AuthCard>
  );
}
