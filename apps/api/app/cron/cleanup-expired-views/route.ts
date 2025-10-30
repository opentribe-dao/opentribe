import { NextResponse } from "next/server";
import { ViewManager } from "@/lib/views";

export async function GET() {
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
