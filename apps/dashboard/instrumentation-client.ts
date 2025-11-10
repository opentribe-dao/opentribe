import { initializePostHog } from "@packages/analytics/posthog/client";
import { initializeSentryClient } from "@packages/logging/client";
import * as Sentry from "@sentry/nextjs";

initializeSentryClient();
initializePostHog();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
