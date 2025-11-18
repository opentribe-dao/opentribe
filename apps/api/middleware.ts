import * as Sentry from "@sentry/nextjs";
import { authMiddleware } from "@packages/auth/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "./env";

const trustedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://opentribe.io",
  "https://api.opentribe.io",
  "https://dashboard.opentribe.io",
  "https://dev.opentribe.io",
  "https://api.dev.opentribe.io",
  "https://dashboard.dev.opentribe.io",
];

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

  // Attach request id to Sentry context and active span (if any)
  try {
    Sentry.setTag("request_id", requestId);
    Sentry.setContext("request", {
      id: requestId,
      method: request.method,
      url: url.toString(),
      pathname: url.pathname,
    });
    const activeSpan = (Sentry as any).getActiveSpan?.();
    if (activeSpan && typeof activeSpan.setAttribute === "function") {
      activeSpan.setAttribute("request.id", requestId);
    }
  } catch {}

  // Redact sensitive headers
  const redactHeader = (name: string, value: string | null) => {
    if (!value) return value;
    const lowered = name.toLowerCase();
    if (lowered === "authorization") return "[redacted]";
    if (lowered === "cookie") return "[redacted]";
    if (lowered === "set-cookie") return "[redacted]";
    return value;
  };

  const headersObj: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headersObj[k] = redactHeader(k, v) ?? "";
  });

  const queryObj: Record<string, string | string[]> = {};
  url.searchParams.forEach((v, k) => {
    if (k in queryObj) {
      const existing = queryObj[k];
      queryObj[k] = Array.isArray(existing) ? [...existing, v] : [existing, v];
    } else {
      queryObj[k] = v;
    }
  });

  // Safely attempt to read a small JSON body without breaking downstream
  const method = request.method.toUpperCase();
  const contentType = request.headers.get("content-type") || "";
  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;
  const shouldTryReadBody =
    ["POST", "PUT", "PATCH"].includes(method) &&
    contentType.includes("application/json") &&
    // avoid logging very large bodies
    (Number.isFinite(contentLength) ? contentLength <= 1024 * 64 : true);

  let loggedBody: unknown;
  if (shouldTryReadBody) {
    try {
      // Clone before consuming to avoid locking the original stream
      const cloned = request.clone();
      const text = (cloned as unknown as Request).text
        ? await (cloned as unknown as Request).text()
        : undefined;
      if (text && text.length <= 1024 * 64) {
        try {
          loggedBody = JSON.parse(text);
        } catch {
          loggedBody = text;
        }
      }
    } catch {
      // ignore body logging errors
    }
  }

  // Try to get user-id from auth headers for logging
  let userId: string | undefined;
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
    const logger: any = console as any;
    if (logger && typeof logger[level] === "function") {
      logger[level](message, meta);
    } else if (logger && typeof logger.log === "function") {
      logger.log(message, meta);
    }
  };

  emit("info", "api:request", {
    requestId,
    method,
    url: url.toString(),
    pathname: url.pathname,
    search: url.search,
    query: queryObj,
    headers: headersObj,
    body: loggedBody,
    contentLength,
    startedAtMs,
    ...(userId && { userId }),
  });

  // Handle CORS preflight OPTIONS requests
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin") ?? "";
    if (corsOptions.allowedOrigins.includes("*") || isAllowedOrigin(origin)) {
      const response = new NextResponse(null, { status: 204 });
      response.headers.set("Access-Control-Allow-Origin", origin);
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
        "Access-Control-Max-Age",
        corsOptions.maxAge?.toString() ?? ""
      );
      return response;
    }
  }

  // for request path starting with `cron` add an if statement
  if (request.nextUrl.pathname.startsWith("/cron")) {
    // Verify this is called by our cron job (you can add auth here)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Handle organization routes - validate auth only
  // Note: Membership checks are done in route handlers (Prisma doesn't work in Edge Runtime)
  const pathname = request.nextUrl.pathname;

  // if (pathname.startsWith("/api/v1/organizations/")) {
  //   // Skip auth check for OPTIONS requests
  //   if (request.method !== "OPTIONS") {
  //     try {
  //       // Check session using Edge-compatible authMiddleware
  //       // const session = await authMiddleware(request);

  //       if (!userId) {
  //         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  //       }
  //       // Membership validation is handled by route handlers using getOrganizationAuth
  //     } catch (error) {
  //       console.error("Error in organization auth middleware:", error);
  //       return NextResponse.json(
  //         { error: "Internal server error" },
  //         { status: 500 }
  //       );
  //     }
  //   }
  // }

  // Response
  const response = NextResponse.next();

  // Correlate and pass timing hints downstream for per-route logging
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-request-start", String(startedAtMs));

  // Log total time taken and response size
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

  // Allowed origins check
  const origin = request.headers.get("origin") ?? "";
  if (corsOptions.allowedOrigins.includes("*") || isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  // Set default CORS headers
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

  // Return
  return response;
}
