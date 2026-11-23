"use client";

// InstallPage.tsx -- first-run setup: creates the first admin account.
// Needs the one-time setup code that install.sh prints in the server terminal.
// Once an admin exists the backend answers 404 and this page shows "already installed".

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { AuthCard } from "@/components/project/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { installSchema, type InstallValues } from "@/lib/validation/install";
import { useDemoAuthStore } from "@/features/auth/useDemoAuthStore";
import {
  ApiError,
  isBackendConfigured,
  login as loginApi,
} from "@/services/api";
import { getSetupStatus, installSite } from "@/services/setup";

type Stage = "loading" | "ready" | "installed" | "unreachable";

export function InstallPage() {
  const router = useRouter();
  const setAuthenticatedUser = useDemoAuthStore(
    (state) => state.setAuthenticatedUser,
  );

  const [stage, setStage] = useState<Stage>(
    isBackendConfigured ? "loading" : "unreachable",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // The admin was created but the automatic sign-in failed.
  const [signInFailed, setSignInFailed] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InstallValues>({
    resolver: zodResolver(installSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      setupCode: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!isBackendConfigured) return;

    let cancelled = false;
    getSetupStatus()
      .then(({ installed }) => {
        if (!cancelled) setStage(installed ? "installed" : "ready");
      })
      .catch(() => {
        if (!cancelled) setStage("unreachable");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(values: InstallValues) {
    setSubmitError("");

    try {
      await installSite({
        setupCode: values.setupCode,
        name: values.name,
        email: values.email,
        password: values.password,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        // Either someone just finished the install, or the server has no SETUP_CODE.
        try {
          const { installed } = await getSetupStatus();
          if (installed) {
            setStage("installed");
            return;
          }
        } catch {
          /* fall through to the message below */
        }
        setSubmitError(
          "Setup is not enabled on this server. Ask the server administrator to set SETUP_CODE (16 or more characters) and restart the API.",
        );
        return;
      }

      if (error instanceof ApiError && error.status === 403) {
        setSubmitError(
          "That setup code is not correct. Copy it again from the server terminal.",
        );
        return;
      }

      if (error instanceof ApiError && error.status === 429) {
        setSubmitError("Too many attempts. Wait a minute and try again.");
        return;
      }

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to finish the installation. Please try again.",
      );
      return;
    }

    // The admin exists now. Sign in through the normal login so there is one login path.
    try {
      const user = await loginApi(values.email, values.password);
      setAuthenticatedUser(user);
      router.push(user.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setSignInFailed(true);
    }
  }

  if (stage === "loading") {
    return <AuthCard title="Set up your site">{null}</AuthCard>;
  }

  if (stage === "unreachable") {
    return (
      <AuthCard
        title="Cannot reach the server"
        subtitle="The setup page could not talk to the API. Check that the backend is running and that NEXT_PUBLIC_API_URL is correct, then reload this page."
      >
        {null}
      </AuthCard>
    );
  }

  if (stage === "installed" || signInFailed) {
    return (
      <AuthCard
        title={signInFailed ? "Admin account created" : "Already installed"}
      >
        <CheckCircle2 className="text-primary" size={44} />

        <p className="mt-4 text-sm text-gray-600">
          {signInFailed
            ? "Your admin account was created, but we could not sign you in automatically. Please log in with the email and password you just chose."
            : "This site is already set up. Log in with your admin account."}
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
      title="Set up your site"
      subtitle="Enter the setup code shown in the server terminal, then create the first admin account."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <div className={errors.setupCode ? "rounded-xl ring-1 ring-red-500" : ""}>
            <Input
              type="text"
              placeholder="Setup code"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(errors.setupCode)}
              {...register("setupCode")}
            />
          </div>
          {errors.setupCode && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {errors.setupCode.message}
            </p>
          )}
        </div>

        <div>
          <div className={errors.name ? "rounded-xl ring-1 ring-red-500" : ""}>
            <Input
              type="text"
              placeholder="Your name"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <div className={errors.email ? "rounded-xl ring-1 ring-red-500" : ""}>
            <Input
              type="email"
              placeholder="Admin email"
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
          <div className={errors.password ? "rounded-xl ring-1 ring-red-500" : ""}>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
              trailing={toggle}
            />
          </div>
          {errors.password ? (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {errors.password.message}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-gray-500">
              Use 8+ characters with an uppercase letter and a number.
            </p>
          )}
        </div>

        <div>
          <div
            className={errors.confirmPassword ? "rounded-xl ring-1 ring-red-500" : ""}
          >
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
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
          label={isSubmitting ? "Installing..." : "Install"}
          disabled={isSubmitting}
          className="w-full justify-center py-3"
        />

        {submitError && (
          <p role="alert" className="text-sm text-red-600">
            {submitError}
          </p>
        )}
      </form>
    </AuthCard>
  );
}
