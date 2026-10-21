// Button.tsx — the base reusable button. Every button in the app should use this component instead of a raw <button> tag.
import { ReactNode } from "react";

interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
}

const variants = {
  primary:
    "bg-primary text-white hover:bg-white hover:text-primary disabled:hover:bg-primary disabled:hover:text-white",
  secondary:
    "bg-transparent text-primary hover:bg-primary hover:text-white disabled:hover:bg-transparent disabled:hover:text-primary",
};

export function Button({
  label,
  onClick,
  variant = "primary",
  type = "button",
  icon,
  className = "",
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md border border-primary font-medium cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {icon}
      {label}
    </button>
  );
}
