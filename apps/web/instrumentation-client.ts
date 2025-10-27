import { initializePostHog } from "@packages/analytics/posthog/client";
import { initializeSentryClient } from "@packages/logging/client";
import * as Sentry from "@sentry/nextjs";

initializePostHog();
initializeSentryClient();

// Enable Sentry navigation tracing per docs
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
