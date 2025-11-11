"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { GoogleAnalytics, GoogleTagManager } from "./google";
import { keys } from "./keys";
import { VercelAnalytics } from "./vercel";

type AnalyticsProviderProps = {
  readonly children: ReactNode;
};

const { NEXT_PUBLIC_GA_MEASUREMENT_ID, NEXT_PUBLIC_GTM_ID } = keys();

/**
 * Check if analytics cookies are consented
 * This function is duplicated here to avoid circular dependencies
 */
function hasAnalyticsConsent(): boolean {
  if (typeof document === "undefined") return false;

  const cookies = document.cookie.split(";");
  const consentCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("cookie-consent=")
  );

  if (!consentCookie) {
    // No consent given yet - don't load analytics
    return false;
  }

  try {
    const value = consentCookie.split("=")[1];
    const decoded = decodeURIComponent(value);
    const consent = JSON.parse(decoded);
    return consent.analytics === true;
  } catch {
    return false;
  }
}

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    // Check consent on mount
    setAnalyticsEnabled(hasAnalyticsConsent());
  }, []);

  return (
    <>
      {analyticsEnabled && NEXT_PUBLIC_GTM_ID && (
        <GoogleTagManager gtmId={NEXT_PUBLIC_GTM_ID} />
      )}
      {children}
      {/* Vercel Analytics is performance monitoring, not user tracking - always load */}
      <VercelAnalytics />
      {analyticsEnabled && NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </>
  );
};
