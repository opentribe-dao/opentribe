import { getTrustedOrigins } from "@packages/auth/trusted-origins";
import { getActiveSpan, setContext, setTag } from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { buildRequestLogMeta } from "./lib/request-log";

const trustedOrigins = getTrustedOrigins();

const setRequestContext = (
  requestId: string,
  request: NextRequest,
  url: URL
) => {
  try {
    setTag("request_id", requestId);
    setContext("request", {
      id: requestId,
      method: request.method,
      url: `${url.origin}${url.pathname}`,
      pathname: url.pathname,
    });
    const activeSpan = getActiveSpan?.();
    if (activeSpan && typeof activeSpan.setAttribute === "function") {
      activeSpan.setAttribute("request.id", requestId);
    }
  } catch {
    // Ignore Sentry instrumentation errors during request logging.
  }
};

const setCorsHeaders = (response: NextResponse, origin: string) => {
  if (corsOptions.allowedOrigins.includes("*") || isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set(
    "Access-Control-Allow-Credentials",
    corsOptions.credentials.toString()
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    corsOptions.allowedMethods.join(",")
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    corsOptions.allowedHeaders.join(",")
  );
  response.headers.set(
    "Access-Control-Expose-Headers",
    corsOptions.exposedHeaders.join(",")
  );
  response.headers.set(
    "Access-Control-Max-Age",
    corsOptions.maxAge?.toString() ?? ""
  );
};

// Helper to check if origin is a Vercel preview deployment
const isVercelPreview = (origin: string): boolean => {
  return (
    origin.includes(".vercel.app") &&
    (origin.includes("opentribe-web") ||
      origin.includes("opentribe-dashboard") ||
      origin.includes("opentribe-api"))
  );
};

// Helper to check if request origin should be allowed
const isAllowedOrigin = (origin: string): boolean => {
  // Always allow trusted origins
  if (trustedOrigins.includes(origin)) {
    return true;
  }

  // In non-production environments, allow Vercel preview deployments
  const vercelEnv = process.env.VERCEL_ENV; // 'production' | 'preview' | 'development'
  if (vercelEnv !== "production" && isVercelPreview(origin)) {
    return true;
  }

  return false;
};

const corsOptions: {
  allowedMethods: string[];
  allowedOrigins: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge?: number;
  credentials: boolean;
} = {
  allowedMethods: ["GET", "DELETE", "PATCH", "POST", "PUT", "OPTIONS"],
  allowedOrigins: trustedOrigins,
  allowedHeaders: [
    "X-CSRF-Token",
    "X-Requested-With",
    "Accept",
    "Accept-Version",
    "Content-Length",
    "Content-MD5",
    "Content-Type",
    "Date",
    "X-Api-Version",
    "Authorization",
    "Cookie",
  ],
  exposedHeaders: [
    "X-CSRF-Token",
    "X-Requested-With",
    "Accept",
    "Accept-Version",
    "Content-Length",
    "Content-MD5",
    "Content-Type",
    "Date",
    "X-Api-Version",
  ],
  maxAge: 60 * 60 * 24 * 30, // 30 days
  credentials: true,
};

// Middleware
// ========================================================
// This function can be marked `async` if using `await` inside
export default async function middleware(request: NextRequest) {
  // --- Request logging (headers, params, body when safe) ---
  const startedAtMs = Date.now();
  const url = new URL(request.url);
  const requestId =
    request.headers.get("x-request-id") ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${startedAtMs}-${Math.random().toString(36).slice(2)}`);

  setRequestContext(requestId, request, url);

  const requestMeta = await buildRequestLogMeta(request);
  const method = request.method.toUpperCase();
  // const hasAuthHeaders =
  //   request.headers.get("cookie") || request.headers.get("authorization");
  // if (hasAuthHeaders) {
  //   try {
  //     const session = await authMiddleware(request);
  //     if (session?.user?.id) {
  //       userId = session.user.id;
  //     }
  //   } catch {
  //     // Ignore auth errors in logging - not critical
  //   }
  // }

  const emit = (
    level: "info" | "error",
    message: string,
    meta: Record<string, unknown>
  ) => {
    const logger = console as Console & {
      error?: (message: string, meta: Record<string, unknown>) => void;
      info?: (message: string, meta: Record<string, unknown>) => void;
      log?: (message: string, meta: Record<string, unknown>) => void;
    };
    if (logger && typeof logger[level] === "function") {
      logger[level](message, meta);
    } else if (logger && typeof logger.log === "function") {
      logger.log(message, meta);
    }
  };

  emit("info", "api:request", {
    requestId,
    method,
    url: requestMeta.url,
    pathname: requestMeta.pathname,
    search: requestMeta.search,
    query: requestMeta.query,
    headers: requestMeta.headers,
    body: requestMeta.body,
    contentLength: requestMeta.contentLength,
    startedAtMs,
  });

  // Handle CORS preflight OPTIONS requests
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin") ?? "";
    if (corsOptions.allowedOrigins.includes("*") || isAllowedOrigin(origin)) {
      const response = new NextResponse(null, { status: 204 });
      setCorsHeaders(response, origin);
      return response;
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-request-start", String(startedAtMs));
  response.headers.append("x-response-logger", "true");
  response.headers.append(
    "Access-Control-Expose-Headers",
    "x-response-logger,x-response-time,x-response-size"
  );

  // Monkey patch response to hook when it's actually sent
  const endTime = Date.now();
  const totalTimeMs = endTime - startedAtMs;
  response.headers.set("x-response-time", `${totalTimeMs}ms`);

  emit("info", "api:response", {
    requestId,
    method,
    url: url.toString(),
    totalTimeMs,
    status: response.status,
  });

  const origin = request.headers.get("origin") ?? "";
  setCorsHeaders(response, origin);
  return response;
}
