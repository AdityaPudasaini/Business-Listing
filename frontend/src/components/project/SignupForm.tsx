"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SocialButtons } from "./SocialButtons";
import { theme } from "@/config/theme";

const secondary = theme.colors.secondary;
const secondary60 = `${secondary}99`;

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  return (
    <div>
      {/* Heading */}
      <h1
        style={{ color: secondary }}
        className="text-2xl md:text-3xl font-extrabold"
      >
        Create an account
      </h1>

      {/* Login link */}
      <p style={{ color: secondary60 }} className="mt-2 text-sm">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{ color: theme.colors.primary }}
          className="font-semibold hover:opacity-80 transition-opacity"
        >
          Log in
        </button>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {/* Names */}
        <div className="grid grid-cols-2 gap-3">
          <Input name="firstName" placeholder="First name" required />

          <Input name="lastName" placeholder="Last name" required />
        </div>

        {/* Email */}
        <Input type="email" name="email" placeholder="Email" required />

        {/* Password */}
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
              style={{ color: secondary60 }}
              className="hover:opacity-70 transition-opacity"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />

        {/* Terms */}
        <label
          style={{ color: secondary60 }}
          className="flex items-start gap-2 text-sm cursor-pointer"
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            required
            style={{
              accentColor: theme.colors.primary,
            }}
            className="mt-0.5 h-4 w-4"
          />

          <span>
            I agree to the{" "}
            <a
              href="#"
              style={{ color: theme.colors.primary }}
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              Terms &amp; Conditions
            </a>
          </span>
        </label>

        {/* Button */}
        <Button
          type="submit"
          label="Create account"
          className="w-full justify-center py-3"
        />
      </form>

      {/* Divider */}
      <div className="mt-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-gray-200" />

        <span
          style={{ color: secondary60 }}
          className="text-sm whitespace-nowrap"
        >
          Or register with
        </span>

        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Google / Apple */}
      <div className="mt-5">
        <SocialButtons />
      </div>
    </div>
  );
}
