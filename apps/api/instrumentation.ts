import * as Sentry from "@sentry/nextjs";
import { initializeSentry } from "@packages/logging/instrumentation";

export const register = initializeSentry();

export const onRequestError = Sentry.captureRequestError;
