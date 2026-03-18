import { NextResponse } from "next/server";
import { ViewManager } from "@/lib/views";
import { validateCronAuth } from "@/lib/cron-auth";

export async function GET(request: Request) {
  // Validate cron authentication
  const authError = validateCronAuth(request);
  if (authError) return authError;

  try {
    const deleted = await ViewManager.cleanupExpired();
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error("Cron cleanup failed", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({});
}
