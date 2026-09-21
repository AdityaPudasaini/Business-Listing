// AuthCard.tsx — the centred white card used by the standalone auth pages
// (forgot password, reset password, social-login callback).
import type { ReactNode } from "react";
import { theme } from "@/config/theme";

interface AuthCardProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-gray-50 px-4 pb-10 pt-24">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl ring-1 ring-black/5 sm:p-8">
        <h1
          className="text-2xl font-extrabold md:text-3xl"
          style={{ color: theme.colors.secondary }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="mt-2 text-sm" style={{ color: theme.colors.secondary }}>
            {subtitle}
          </p>
        )}

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
