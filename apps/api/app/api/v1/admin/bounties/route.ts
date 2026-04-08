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
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const visibility = searchParams.get("visibility") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (visibility && visibility !== "all") {
      where.visibility = visibility;
    }

    const [bounties, total] = await Promise.all([
      database.bounty.findMany({
        where,
        include: {
          organization: {
            select: { id: true, name: true, slug: true, logo: true },
          },
          _count: {
            select: { submissions: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      database.bounty.count({ where }),
    ]);

    return NextResponse.json({
      data: bounties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin bounties list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bounties" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
