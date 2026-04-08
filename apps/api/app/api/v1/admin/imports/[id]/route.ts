import { requireSuperAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { database } from "@packages/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { id } = await params;

    const importJob = await database.importJob.findUnique({
      where: { id },
    });

    if (!importJob) {
      return NextResponse.json(
        { error: "Import job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: importJob });
  } catch (error) {
    console.error("Admin import detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch import job" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
