"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { theme } from "@/config/theme";
import { getActiveVertical } from "@/features/verticals";
import { adminLoginSchema } from "@/lib/validation/account";
import { useDemoAuthStore } from "@/features/auth/useDemoAuthStore";
import type { z } from "zod";

type AdminLoginValues = z.infer<typeof adminLoginSchema>;

const DEMO_ADMIN_PASSWORD = "Admin123";

export function AdminLoginPage() {
  const vertical = getActiveVertical();
  const demoAdminEmail = `admin@${vertical.brandName.toLowerCase()}.com`;
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const signInAdmin = useDemoAuthStore((state) => state.signInAdmin);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: AdminLoginValues) {
    if (
      values.email.trim().toLowerCase() !== demoAdminEmail ||
      values.password !== DEMO_ADMIN_PASSWORD
    ) {
      setError("root", {
        message: "Use the provided demo administrator credentials.",
      });

      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    signInAdmin();
    router.push("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
        <div
          style={{
            backgroundColor: `${theme.colors.primary}14`,
            color: theme.colors.primary,
          }}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
        >
          <ShieldCheck size={27} />
        </div>

        <div className="mt-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            Administration
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-gray-950">
            Admin login
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Sign in to manage business listing reviews.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mt-8 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-900">
              Admin email
            </label>

            <div
              className={errors.email ? "rounded-xl ring-1 ring-red-500" : ""}
            >
              <Input
                type="email"
                placeholder={demoAdminEmail}
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
            <label className="mb-1.5 block text-sm font-semibold text-gray-900">
              Admin password
            </label>

            <div
              className={
                errors.password ? "rounded-xl ring-1 ring-red-500" : ""
              }
            >
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="text-gray-400 transition hover:text-gray-700"
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

          {errors.root && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {errors.root.message}
            </p>
          )}

          <Button
            type="submit"
            label={isSubmitting ? "Signing in..." : "Sign in as admin"}
            disabled={isSubmitting}
            className="w-full justify-center py-3"
          />
        </form>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
            Frontend demo credentials
          </p>

          <p className="mt-2 text-sm text-amber-900">
            Email: <strong>{demoAdminEmail}</strong>
          </p>

          <p className="mt-1 text-sm text-amber-900">
            Password: <strong>Admin123</strong>
          </p>
        </div>
      </section>
    </main>
  );
}
