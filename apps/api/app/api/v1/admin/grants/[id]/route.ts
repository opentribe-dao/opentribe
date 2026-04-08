import { requireSuperAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { formatZodError } from "@/lib/zod-errors";
import { database } from "@packages/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateGrantSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  summary: z.string().optional(),
  instructions: z.string().optional(),
  token: z.string().optional(),
  skills: z.array(z.string()).optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  totalFunds: z.number().optional(),
  status: z.enum(["OPEN", "PAUSED", "CLOSED"]).optional(),
  visibility: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  source: z.enum(["NATIVE", "EXTERNAL"]).optional(),
  fundingSource: z.enum(["SELF_FUNDED", "TREASURY"]).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { id } = await params;

    const grant = await database.grant.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        applications: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            applicant: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        _count: {
          select: { applications: true, rfps: true },
        },
      },
    });

    if (!grant) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }

    return NextResponse.json({ data: grant });
  } catch (error) {
    console.error("Admin grant detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch grant" },
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
    const validated = updateGrantSchema.parse(body);

    const grant = await database.grant.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ data: grant });
  } catch (error) {
    console.error("Admin grant update error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update grant" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
