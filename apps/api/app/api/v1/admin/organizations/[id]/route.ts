import { requireSuperAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { formatZodError } from "@/lib/zod-errors";
import { database } from "@packages/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateOrgSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  orgType: z.enum(["COMPANY", "DAO", "FOUNDATION", "CURATOR_GROUP"]).optional(),
  visibility: z.enum(["ACTIVE", "UNDER_REVIEW", "ARCHIVED", "VERIFIED"]).optional(),
  isVerified: z.boolean().optional(),
  managedByPlatform: z.boolean().optional(),
  websiteUrl: z.string().optional(),
  email: z.string().optional(),
  logo: z.string().optional(),
  location: z.string().optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { id } = await params;

    const organization = await database.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
        },
        bounties: {
          select: {
            id: true,
            title: true,
            status: true,
            visibility: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        grants: {
          select: {
            id: true,
            title: true,
            status: true,
            visibility: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: {
            bounties: true,
            grants: true,
            members: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: organization });
  } catch (error) {
    console.error("Admin organization detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
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
    const validated = updateOrgSchema.parse(body);

    const organization = await database.organization.update({
      where: { id },
      data: validated,
    });

    return NextResponse.json({ data: organization });
  } catch (error) {
    console.error("Admin organization update error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
