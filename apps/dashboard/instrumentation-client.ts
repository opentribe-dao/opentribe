import { initializePostHog } from "@packages/analytics/posthog/client";
import { initializeSentryClient } from "@packages/logging/client";
import * as Sentry from "@sentry/nextjs";

/**
 * Check if analytics cookies are consented
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

// Always initialize Sentry for error monitoring (not user tracking)
initializeSentryClient();

// Only initialize PostHog if user has consented to analytics
if (hasAnalyticsConsent()) {
  initializePostHog();
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
