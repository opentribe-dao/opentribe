import { requireSuperAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { auditLog } from "@/lib/audit-log";
import { formatZodError } from "@/lib/zod-errors";
import { database } from "@packages/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateUserSchema = z.object({
  role: z.enum(["user", "admin", "superadmin"]).optional(),
  banned: z.boolean().optional(),
  banReason: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { id } = await params;

    const user = await database.user.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
              },
            },
          },
        },
        applications: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            grant: {
              select: { id: true, title: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        submissions: {
          select: {
            id: true,
            title: true,
            status: true,
            isWinner: true,
            createdAt: true,
            bounty: {
              select: { id: true, title: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("Admin user detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { id } = await params;
    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    const user = await database.user.update({
      where: { id },
      data: {
        ...validated,
        banExpires: validated.banned === false ? null : undefined,
        banReason: validated.banned === false ? null : validated.banReason,
      },
    });

    await auditLog({
      action: "user.role_change",
      actorId: admin.userId,
      targetId: id,
      targetType: "user",
      metadata: validated,
    });

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("Admin user update error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
