// Button.tsx — the base reusable button. Every button in the app should use this component instead of a raw <button> tag.
import { theme } from "@/config/theme";

interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
}

export function Button({ label, onClick, variant = "primary", type = "button" }: ButtonProps) {
  const style =
    variant === "primary"
      ? { backgroundColor: theme.colors.primary, color: "#fff" }
      : { backgroundColor: "transparent", color: theme.colors.primary, border: `1px solid ${theme.colors.primary}` };

  return (
    <button type={type} onClick={onClick} style={style} className="px-4 py-2 rounded-md font-medium">
      {label}
    </button>
  );
}
