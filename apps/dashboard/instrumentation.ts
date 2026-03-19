import { initializeSentry } from "@packages/logging/instrumentation";
import * as Sentry from "@sentry/nextjs";

export const register = initializeSentry();

export const onRequestError = Sentry.captureRequestError;
