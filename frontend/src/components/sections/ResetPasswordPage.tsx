"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { AuthCard } from "@/components/project/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { theme } from "@/config/theme";
import { resetPasswordSchema } from "@/lib/validation/account";
import { resetPassword } from "@/services/api";
import type { z } from "zod";

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  // undefined = still reading the URL, "" = no token in the link.
  const [token, setToken] = useState<string | undefined>(undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordValues) {
    if (!token) return;
    setSubmitError("");

    try {
      await resetPassword(token, values.password);
      setDone(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to reset your password. Please try again.",
      );
    }
  }

  if (token === undefined) {
    return <AuthCard title="Reset your password">{null}</AuthCard>;
  }

  if (!token) {
    return (
      <AuthCard
        title="Link not valid"
        subtitle="This password reset link is missing or incomplete."
      >
        <Link
          href="/forgot-password"
          className="text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ color: theme.colors.primary }}
        >
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="Password updated">
        <CheckCircle2 size={44} style={{ color: theme.colors.primary }} />

        <p className="mt-4 text-sm text-gray-600">
          Your password has been changed. You can now log in with the new one.
        </p>

        <Link
          href="/login"
          style={{ backgroundColor: theme.colors.primary }}
          className="mt-6 inline-flex rounded-md px-4 py-2 font-medium text-white transition-opacity hover:opacity-90"
        >
          Go to log in
        </Link>
      </AuthCard>
    );
  }

  const toggle = (
    <button
      type="button"
      onClick={() => setShowPassword((current) => !current)}
      aria-label={showPassword ? "Hide password" : "Show password"}
      className="text-gray-400 transition-colors hover:text-gray-600"
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Use 8+ characters with an uppercase letter and a number."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <div
            className={errors.password ? "rounded-xl ring-1 ring-red-500" : ""}
          >
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
              trailing={toggle}
            />
          </div>

          {errors.password && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <div
            className={
              errors.confirmPassword ? "rounded-xl ring-1 ring-red-500" : ""
            }
          >
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register("confirmPassword")}
            />
          </div>

          {errors.confirmPassword && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          label={isSubmitting ? "Saving..." : "Reset password"}
          disabled={isSubmitting}
          className="w-full justify-center py-3"
        />

        {submitError && (
          <div role="alert" className="text-sm text-red-600">
            <p>{submitError}</p>
            <Link
              href="/forgot-password"
              className="mt-1 inline-block font-semibold underline underline-offset-2"
            >
              Request a new link
            </Link>
          </div>
        )}
      </form>
    </AuthCard>
  );
}
