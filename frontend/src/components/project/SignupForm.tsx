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
import { signupSchema } from "@/lib/validation/account";
import { useDemoAuthStore } from "@/features/auth/useDemoAuthStore";
import type { z } from "zod";

const secondary = theme.colors.secondary;
const secondary60 = `${secondary}99`;

type SignupFormValues = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const signUp = useDemoAuthStore((state) => state.signUp);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      agreed: false,
    },
  });

  async function onSubmit(values: SignupFormValues) {
    // Frontend demo signup only. Replace with a real API request later.
    await new Promise((resolve) => setTimeout(resolve, 700));

    signUp({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
    });

    router.push("/dashboard");
  }

  return (
    <div>
      <h1
        style={{ color: secondary }}
        className="text-2xl font-extrabold md:text-3xl"
      >
        Create an account
      </h1>

      <p style={{ color: secondary60 }} className="mt-2 text-sm">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{ color: theme.colors.primary }}
          className="font-semibold transition-opacity hover:opacity-80"
        >
          Log in
        </button>
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-8 space-y-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div
              className={
                errors.firstName ? "rounded-xl ring-1 ring-red-500" : ""
              }
            >
              <Input
                placeholder="First name"
                autoComplete="given-name"
                aria-invalid={Boolean(errors.firstName)}
                {...register("firstName")}
              />
            </div>

            {errors.firstName && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <div
              className={
                errors.lastName ? "rounded-xl ring-1 ring-red-500" : ""
              }
            >
              <Input
                placeholder="Last name"
                autoComplete="family-name"
                aria-invalid={Boolean(errors.lastName)}
                {...register("lastName")}
              />
            </div>

            {errors.lastName && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

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
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{ color: secondary60 }}
                  className="transition-opacity hover:opacity-70"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
          </div>

          {errors.password ? (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {errors.password.message}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-gray-400">
              Use 8+ characters with an uppercase letter and a number.
            </p>
          )}
        </div>

        <div>
          <label
            style={{ color: secondary60 }}
            className="flex cursor-pointer items-start gap-2 text-sm"
          >
            <input
              type="checkbox"
              {...register("agreed")}
              style={{ accentColor: theme.colors.primary }}
              className="mt-0.5 h-4 w-4"
            />

            <span>
              I agree to the{" "}
              <a
                href="#"
                style={{ color: theme.colors.primary }}
                className="underline underline-offset-2 transition-opacity hover:opacity-80"
              >
                Terms &amp; Conditions
              </a>
            </span>
          </label>

          {errors.agreed && (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              {errors.agreed.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          label={isSubmitting ? "Creating account..." : "Create account"}
          disabled={isSubmitting}
          className="w-full justify-center py-3"
        />
      </form>

      <div className="mt-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-gray-200" />

        <span
          style={{ color: secondary60 }}
          className="whitespace-nowrap text-sm"
        >
          Or register with
        </span>

        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="mt-5">
        <SocialButtons />
      </div>
    </div>
  );
}
