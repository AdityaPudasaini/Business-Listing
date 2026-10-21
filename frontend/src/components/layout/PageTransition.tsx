// PageTransition.tsx — wraps every page's content so navigating between
"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const EXCLUDED_ROUTES = ["/login", "/signup"];

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const skip = EXCLUDED_ROUTES.includes(pathname);

  return (
    <div key={pathname} className={skip ? undefined : "animate-fade-in-up"}>
      {children}
    </div>
  );
}
