import { auth } from "@packages/auth/server";
import { OPTIONAL_URL_REGEX } from "@packages/base/lib/utils";
import { database } from "@packages/db";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function OPTIONS() {
  return NextResponse.json({});
}

// GET /api/v1/organizations/[organizationId] - Get organization details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organization = await database.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
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

    // Check if user has access to this organization
    const isMember = organization.members.some(
      (member) => member.userId === sessionData.user.id
    );

    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/organizations/[organizationId] - Update organization
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to update organization
    const member = await database.member.findFirst({
      where: {
        organizationId,
        userId: sessionData.user.id,
        role: {
          in: ["owner", "admin"],
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      slug: z.string().min(3).max(50).optional(),
      email: z.email().optional().nullable(),
      websiteUrl: z.string().regex(OPTIONAL_URL_REGEX).optional().nullable(),
      twitter: z.string().optional().nullable(),
      linkedin: z.string().optional().nullable(),
      description: z.string().max(500).optional().nullable(),
      logo: z.string().regex(OPTIONAL_URL_REGEX).optional().nullable(),
      location: z.string().min(1).max(100).optional().nullable(),
      industry: z.string().min(1).optional().nullable(),
      type: z.string().min(1).optional().nullable(),
    });

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    // Check if slug is already taken
    if (validatedData.slug) {
      const existingOrg = await database.organization.findFirst({
        where: {
          slug: validatedData.slug,
          id: { not: organizationId },
        },
      });

      if (existingOrg) {
        return NextResponse.json(
          { error: "Slug already taken" },
          { status: 400 }
        );
      }
    }

    const { type, industry, ...rest } = validatedData;

    const updatedOrganization = await database.organization.update({
      where: { id: organizationId },
      data: {
        ...rest,
        ...(typeof industry === "string" && industry.trim().length > 0
          ? { industry: [industry] }
          : {}),
        ...(typeof type === "string" && type.trim().length > 0
          ? { metadata: JSON.stringify({ type }) }
          : {}),
        updatedAt: new Date(),
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ organization: updatedOrganization });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: z.treeifyError(error) },
        { status: 400 }
      );
    }

    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/organizations/[organizationId] - Delete organization (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is the owner
    const member = await database.member.findFirst({
      where: {
        organizationId,
        userId: sessionData.user.id,
        role: "owner",
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Only the owner can delete the organization" },
        { status: 403 }
      );
    }

    // Delete organization (cascade will handle related records)
    await database.organization.delete({
      where: { id: organizationId },
    });

    return NextResponse.json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
}
