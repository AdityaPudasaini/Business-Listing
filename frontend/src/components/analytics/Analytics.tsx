// Analytics.tsx -- starts analytics only after the visitor accepts the cookie banner, and
// reports page views on route changes. Renders nothing. See lib/analytics.ts for the rules.
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { onConsentChange } from "@/lib/cookieConsent";
import {
  consentGiven,
  getAnalyticsConfig,
  isSensitivePath,
  loadAnalytics,
  setAnalyticsOptOut,
  trackPageView,
} from "@/lib/analytics";

export function Analytics() {
  const pathname = usePathname();
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const config = getAnalyticsConfig();
    if (config.provider === "none") return;

    const evaluate = () => {
      const allowed = consentGiven();
      setAnalyticsOptOut(config, !allowed);
      setConsented(allowed);
    };
    evaluate();
    return onConsentChange(evaluate);
  }, []);

  useEffect(() => {
    if (!consented || isSensitivePath(pathname)) return;
    const config = getAnalyticsConfig();
    loadAnalytics(config); // does nothing after the first call
    trackPageView(pathname, config);
  }, [consented, pathname]);

  return null;
}
