// Button.tsx — the base reusable button. Every button in the app should use this component instead of a raw <button> tag.
import { ReactNode } from "react";
import { theme } from "@/config/theme";

interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
  icon?: ReactNode;
  className?: string;
}

export function Button({
  label,
  onClick,
  variant = "primary",
  type = "button",
  icon,
  className = "",
}: ButtonProps) {
  const isPrimary = variant === "primary";

  const vars = isPrimary
    ? {
        ["--btn-bg" as string]: theme.colors.primary,
        ["--btn-text" as string]: "#fff",
        ["--hover-bg" as string]: "#fff",
        ["--hover-text" as string]: theme.colors.primary,
      }
    : {
        ["--btn-bg" as string]: "transparent",
        ["--btn-text" as string]: theme.colors.primary,
        ["--hover-bg" as string]: theme.colors.primary,
        ["--hover-text" as string]: "#fff",
      };

  return (
    <button
      type={type}
      onClick={onClick}
      style={{ ...vars, border: `1px solid ${theme.colors.primary}` }}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium cursor-pointer transition-colors duration-200 bg-[var(--btn-bg)] text-[var(--btn-text)] hover:bg-[var(--hover-bg)] hover:text-[var(--hover-text)] ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}
