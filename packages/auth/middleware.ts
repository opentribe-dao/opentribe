import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type AuthSession = {
  userId?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    profileCompleted?: boolean;
    role?: string;
  };
} | null;

// Higher-Order Function version for web app (wraps other middleware)
export const authMiddlewareWrapper = (
  middleware: (
    auth: AuthSession,
    request: NextRequest
  ) => NextResponse | Promise<NextResponse>
) => {
  return async (request: NextRequest) => {
    // Get the API URL from environment, fallback to localhost for development
    const apiUrl = process.env.BETTER_AUTH_URL;
    const url = new URL("/api/auth/get-session", apiUrl);

    let session: AuthSession = null;

    try {
      const response = await fetch(url, {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });

      // Check if response is ok and has JSON content type
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          session = await response.json();
        }
      }
    } catch (error) {
      console.error("Auth middleware error:", error);
      session = null;
    }

    // Call the wrapped middleware with auth session and request
    return middleware(session, request);
  };
};
