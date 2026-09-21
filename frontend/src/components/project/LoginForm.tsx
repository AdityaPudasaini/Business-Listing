"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SocialButtons } from "./SocialButtons";
import { theme } from "@/config/theme";
import { loginSchema } from "@/lib/validation/account";
import { useDemoAuthStore } from "@/features/auth/useDemoAuthStore";
import { isBackendConfigured, login as loginApi } from "@/services/api";
import type { z } from "zod";
import Link from "next/link";

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const signIn = useDemoAuthStore((state) => state.signIn);
  const setAuthenticatedUser = useDemoAuthStore(
    (state) => state.setAuthenticatedUser,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setSubmitError("");

    try {
      if (isBackendConfigured) {
        const user = await loginApi(values.email, values.password);
        setAuthenticatedUser(user);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        signIn(values.email);
      }

      router.push("/dashboard");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to log in.",
      );
    }
  }

  return (
    <div>
      <h1
        className="text-2xl font-extrabold md:text-3xl"
        style={{ color: theme.colors.secondary }}
      >
        Welcome back
      </h1>

      <p className="mt-2 text-sm" style={{ color: theme.colors.secondary }}>
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignup}
          style={{ color: theme.colors.primary }}
          className="font-semibold transition-opacity hover:opacity-80"
        >
          Sign up
        </button>
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-6 space-y-4"
      >
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

        <div>
          <div
            className={errors.password ? "rounded-xl ring-1 ring-red-500" : ""}
          >
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-gray-400 transition-colors hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
          </div>

          {errors.password && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: theme.colors.secondary }}
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          label={isSubmitting ? "Logging in..." : "Log in"}
          disabled={isSubmitting}
          className="w-full justify-center py-3"
        />

        {submitError && (
          <p role="alert" className="text-sm text-red-600">
            {submitError}
          </p>
        )}
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />

        <span className="text-xs" style={{ color: theme.colors.secondary }}>
          Or continue with
        </span>

        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="mt-4">
        <SocialButtons />
      </div>
    </div>
  );
}
