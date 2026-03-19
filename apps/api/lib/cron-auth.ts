import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/env";

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

  const providedToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!providedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expectedBuffer = Buffer.from(expectedToken);
  const providedBuffer = Buffer.from(providedToken);

  if (expectedBuffer.length !== providedBuffer.length) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!timingSafeEqual(expectedBuffer, providedBuffer)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
