import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/v1/organizations/[organizationId] - Get organization details
export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const organization = await database.organization.findUnique({
      where: { id: params.organizationId },
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
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if user has access to this organization
    const isMember = organization.members.some(
      (member) => member.userId === sessionData.user.id
    );

    if (!isMember) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { organization },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PATCH /api/v1/organizations/[organizationId] - Update organization
export async function PATCH(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if user has permission to update organization
    const member = await database.member.findFirst({
      where: {
        organizationId: params.organizationId,
        userId: sessionData.user.id,
        role: {
          in: ["owner", "admin"],
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: corsHeaders }
      );
    }

    const updateSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      slug: z.string().min(3).max(50).optional(),
      email: z.string().email().optional().nullable(),
      website: z.string().url().optional().nullable(),
      twitter: z.string().optional().nullable(),
      instagram: z.string().optional().nullable(),
      shortDescription: z.string().max(200).optional().nullable(),
      longDescription: z.string().optional().nullable(),
      logo: z.string().url().optional().nullable(),
    });

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    // Check if slug is already taken
    if (validatedData.slug) {
      const existingOrg = await database.organization.findFirst({
        where: {
          slug: validatedData.slug,
          id: { not: params.organizationId },
        },
      });

      if (existingOrg) {
        return NextResponse.json(
          { error: "Slug already taken" },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const updatedOrganization = await database.organization.update({
      where: { id: params.organizationId },
      data: {
        ...validatedData,
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

    return NextResponse.json(
      { organization: updatedOrganization },
      { headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE /api/v1/organizations/[organizationId] - Delete organization (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if user is the owner
    const member = await database.member.findFirst({
      where: {
        organizationId: params.organizationId,
        userId: sessionData.user.id,
        role: "owner",
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Only the owner can delete the organization" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Delete organization (cascade will handle related records)
    await database.organization.delete({
      where: { id: params.organizationId },
    });

    return NextResponse.json(
      { message: "Organization deleted successfully" },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500, headers: corsHeaders }
    );
  }
}