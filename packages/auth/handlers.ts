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
const isLocalRateLimitFallbackAllowed = () =>
  ["development", "test"].includes(process.env.NODE_ENV ?? "");

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
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

  try {
    const payload = await request.clone().json();
    const email =
      typeof payload?.email === "string"
        ? payload.email.trim().toLowerCase()
        : "unknown";

    return `${ip}:${email}`;
  } catch {
    return ip;
  }
};

export const POST = async (request: Request) => {
  const { pathname } = new URL(request.url);
  const rateLimitedAction = getRateLimitedAction(pathname);

  if (rateLimitedAction) {
    if (!(isRedisConfigured() || isLocalRateLimitFallbackAllowed())) {
      return NextResponse.json(
        { error: "Auth rate limiting is unavailable. Please contact support." },
        { status: 503 }
      );
    }

    const identifier = await getRateLimitIdentifier(request);
    const { success } = await rateLimitedAction.limiter.limit(
      `${rateLimitedAction.keyPrefix}:${identifier}`
    );

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
