import { env } from "@/env";
import { NextResponse } from "next/server";

/**
 * Validates CRON_SECRET authorization header
 * Used to secure internal cron job endpoints
 */
export function validateCronAuth(request: Request): NextResponse | null {
  const authHeader = request.headers.get("authorization");
  const expectedToken = env.CRON_SECRET;

  if (!expectedToken) {
    console.error("CRON_SECRET environment variable is not set");
    return NextResponse.json(
      { error: "Internal server configuration error" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
