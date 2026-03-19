import "server-only";

import {
  createRateLimiter,
  slidingWindow,
} from "@packages/security/rate-limit";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import { auth } from "./server";

const { POST: authPost, GET: authGet } = toNextJsHandler(auth);
const isRedisConfigured = () =>
  Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
const localRateLimitState = new Map<string, number[]>();
let warnedAboutMissingRedis = false;

const emitMissingRedisWarning = () => {
  if (warnedAboutMissingRedis) {
    return;
  }

  warnedAboutMissingRedis = true;
  console.error(
    "[auth] Upstash Redis is not configured; using in-memory auth rate limiting fallback."
  );
};

const signInRateLimiter = createRateLimiter({
  limiter: slidingWindow(5, "1 m"),
  prefix: "auth-sign-in",
});

const passwordResetRateLimiter = createRateLimiter({
  limiter: slidingWindow(3, "15 m"),
  prefix: "auth-password-reset",
});

const getRateLimitedAction = (pathname: string) => {
  if (pathname.endsWith("/sign-in/email")) {
    return {
      limiter: signInRateLimiter,
      keyPrefix: "sign-in",
    };
  }

  if (
    pathname.endsWith("/forget-password") ||
    pathname.endsWith("/reset-password")
  ) {
    return {
      limiter: passwordResetRateLimiter,
      keyPrefix: "password-reset",
    };
  }

  return null;
};

const getRateLimitIdentifier = async (request: Request) => {
  try {
    const payload = await request.clone().json();
    const email =
      typeof payload?.email === "string"
        ? payload.email.trim().toLowerCase()
        : "unknown";

    return email;
  } catch {
    return "unknown";
  }
};

const applyLocalRateLimit = (
  key: string,
  options: { maxAttempts: number; windowMs: number }
) => {
  const now = Date.now();
  const cutoff = now - options.windowMs;
  const attempts = (localRateLimitState.get(key) || []).filter(
    (timestamp) => timestamp > cutoff
  );

  if (attempts.length >= options.maxAttempts) {
    localRateLimitState.set(key, attempts);
    return { success: false };
  }

  attempts.push(now);
  localRateLimitState.set(key, attempts);
  return { success: true };
};

const getLocalFallbackOptions = (keyPrefix: string) =>
  keyPrefix === "sign-in"
    ? { maxAttempts: 5, windowMs: 60_000 }
    : { maxAttempts: 3, windowMs: 15 * 60_000 };

export const __resetLocalRateLimitStateForTests = () => {
  localRateLimitState.clear();
  warnedAboutMissingRedis = false;
};

export const POST = async (request: Request) => {
  const { pathname } = new URL(request.url);
  const rateLimitedAction = getRateLimitedAction(pathname);

  if (rateLimitedAction) {
    const identifier = await getRateLimitIdentifier(request);
    const key = `${rateLimitedAction.keyPrefix}:${identifier}`;

    if (!isRedisConfigured()) {
      emitMissingRedisWarning();

      const { success } = applyLocalRateLimit(
        key,
        getLocalFallbackOptions(rateLimitedAction.keyPrefix)
      );

      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        );
      }

      return authPost(request);
    }

    const { success } = await rateLimitedAction.limiter.limit(key);

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  return authPost(request);
};

export const GET = authGet;
