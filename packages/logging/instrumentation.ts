import { init } from "@sentry/nextjs";
import { keys } from "./keys";

const opts = {
  dsn: keys().SENTRY_DSN ?? keys().NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: true,
  enabled: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
};

export const initializeSentry = () => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    init(opts);
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    init(opts);
  }
};
