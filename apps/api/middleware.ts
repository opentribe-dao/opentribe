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
export default function middleware(request: NextRequest) {
  // for request path starting with `cron` add an if statement
  if (request.nextUrl.pathname.startsWith("/cron")) {
    // Verify this is called by our cron job (you can add auth here)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  // Response
  const response = NextResponse.next();

  // Allowed origins check
  const origin = request.headers.get("origin") ?? "";
  if (
    corsOptions.allowedOrigins.includes("*") ||
    corsOptions.allowedOrigins.includes(origin)
  ) {
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
