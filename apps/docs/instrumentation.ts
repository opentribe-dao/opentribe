import * as Sentry from "@sentry/nextjs";
import { initializeSentry } from "@packages/logging/instrumentation";

// Register server-side Sentry instrumentation only if DSN is configured
export const register = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? initializeSentry()
  : undefined;

export const onRequestError = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? Sentry.captureRequestError
  : undefined;
