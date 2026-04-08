import { requireSuperAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { database } from "@packages/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    const [claims, total] = await Promise.all([
      database.claimRequest.findMany({
        where,
        include: {
          ecosystemProfile: {
            select: {
              id: true,
              displayName: true,
              slug: true,
              email: true,
              github: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      database.claimRequest.count({ where }),
    ]);

    return NextResponse.json({
      data: claims,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin claims list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
