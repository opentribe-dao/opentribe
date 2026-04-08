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
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && role !== "all") {
      where.role = role;
    }

    if (status === "banned") {
      where.banned = true;
    } else if (status === "active") {
      where.banned = false;
    } else if (status === "profileComplete") {
      where.profileCompleted = true;
    } else if (status === "profileIncomplete") {
      where.profileCompleted = false;
    }

    const [users, total] = await Promise.all([
      database.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          banned: true,
          profileCompleted: true,
          lastSeen: true,
          createdAt: true,
          username: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      database.user.count({ where }),
    ]);

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
