"use client";

import { InputHTMLAttributes, ReactNode } from "react";
import { theme } from "@/config/theme";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  trailing?: ReactNode;
  containerClassName?: string;
}

const secondary = theme.colors.secondary;

export function Input({
  trailing,
  containerClassName = "",
  className = "",
  ...inputProps
}: InputProps) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderColor: "#d9d9d9",
        ["--hover-border" as string]: "#bdbdbd",
        ["--focus-border" as string]: theme.colors.primary,
        ["--focus-ring" as string]: theme.colors.primary,
      }}
      className={`
        flex items-center gap-2
        border rounded-xl px-5
        transition-all duration-200
        hover:border-[var(--hover-border)]
        focus-within:border-[var(--focus-border)]
        focus-within:ring-1
        focus-within:ring-[var(--focus-ring)]
        ${containerClassName}
      `}
    >
      <input
        {...inputProps}
        style={{
          color: secondary,
        }}
        className={`
          w-full
          py-3.5
          text-sm
          outline-none
          bg-transparent
          placeholder-gray-400
          ${className}
        `}
      />

      {trailing}
    </div>
  );
}
