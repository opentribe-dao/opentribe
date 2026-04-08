import { requireSuperAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { formatZodError } from "@/lib/zod-errors";
import { database } from "@packages/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateBountySchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["OPEN", "REVIEWING", "COMPLETED", "CLOSED", "CANCELLED"]).optional(),
  visibility: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  amount: z.number().optional(),
  token: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { id } = await params;

    const bounty = await database.bounty.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        submissions: {
          select: {
            id: true,
            title: true,
            status: true,
            isWinner: true,
            createdAt: true,
            submitter: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        _count: {
          select: { submissions: true, comments: true },
        },
      },
    });

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    return NextResponse.json({ data: bounty });
  } catch (error) {
    console.error("Admin bounty detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bounty" },
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
    const validated = updateBountySchema.parse(body);

    const bounty = await database.bounty.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ data: bounty });
  } catch (error) {
    console.error("Admin bounty update error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update bounty" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
