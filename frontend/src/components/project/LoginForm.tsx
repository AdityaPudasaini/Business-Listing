// LoginForm.tsx — the login fields, used inside AuthPage.tsx's sliding
// panel. Not wired to a real backend yet — onSubmit just prevents the
// default page reload until real auth is added.
"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SocialButtons } from "./SocialButtons";
import { theme } from "@/config/theme";

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: wire to a real auth backend once one is chosen
  }

  return (
    <div>
      {/* Main heading */}
      <h1
        className="text-2xl md:text-3xl font-extrabold"
        style={{ color: theme.colors.secondary }}
      >
        Welcome back
      </h1>

      {/* Signup text */}
      <p className="mt-2 text-sm" style={{ color: theme.colors.secondary }}>
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignup}
          style={{ color: theme.colors.primary }}
          className="font-semibold hover:opacity-80 transition-opacity"
        >
          Sign up
        </button>
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <Input type="email" name="email" placeholder="Email" required />

        <Input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Enter your password"
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        {/* Forgot password */}
        <div className="flex justify-end">
          <a
            href="#"
            className="text-sm hover:opacity-70 transition-opacity"
            style={{ color: theme.colors.secondary }}
          >
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          label="Log in"
          className="w-full justify-center py-3"
        />
      </form>

      {/* Divider */}
      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />

        <span className="text-xs" style={{ color: theme.colors.secondary }}>
          Or continue with
        </span>

        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Social buttons */}
      <div className="mt-4">
        <SocialButtons />
      </div>
    </div>
  );
}
