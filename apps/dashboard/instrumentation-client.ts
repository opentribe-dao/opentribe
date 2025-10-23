import { initializeSentryClient } from "@packages/logging/client";
import * as Sentry from "@sentry/nextjs";
import { initializePostHog } from "@packages/analytics/posthog/client";

initializeSentryClient();
initializePostHog();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
