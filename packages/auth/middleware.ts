import type { NextRequest } from "next/server";

export type AuthSession = {
  userId?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
    profileCompleted?: boolean;
    role?: string;
  };
} | null;

export const authMiddleware = async (
  request: NextRequest
): Promise<AuthSession | null> => {
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
  }

  return session;
};
