import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

export async function OPTIONS() {
  return NextResponse.json({});
}

// PATCH /api/v1/organizations/[organizationId]/rfps/[rfpId] - Update RFP
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; rfpId: string }> }
) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to update RFPs
    const member = await database.member.findFirst({
      where: {
        organizationId: (await params).organizationId,
        userId: sessionData.user.id,
        role: {
          in: ["owner", "admin"],
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if the RFP belongs to this organization
    const existingRfp = await database.rFP.findFirst({
      where: {
        id: (await params).rfpId,
        grant: {
          organizationId: (await params).organizationId,
        },
      },
      include: {
        grant: true,
      },
    });

    if (!existingRfp) {
      return NextResponse.json(
        { error: "RFP not found or doesn't belong to this organization" },
        { status: 404 }
      );
    }

    const updateRfpSchema = z.object({
      grantId: z.string().optional(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().min(1).optional(),
      resources: z
        .array(
          z.object({
            title: z.string(),
            url: z
              .string()
              .regex(
                /^(https?:\/\/)?([a-z\d]([a-z\d-]*[a-z\d])?\.)+[a-z]{2,6}$/i,
                "Invalid URL format"
              ),
            description: z.string().optional(),
          })
        )
        .optional(),
      status: z.enum(["OPEN", "CLOSED", "COMPLETED"]).optional(),
      visibility: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    });

    const body = await request.json();
    const validatedData = updateRfpSchema.parse(body);

    // If changing grant, verify the new grant belongs to this organization
    if (
      validatedData.grantId &&
      validatedData.grantId !== existingRfp.grantId
    ) {
      const grant = await database.grant.findFirst({
        where: {
          id: validatedData.grantId,
          organizationId: (await params).organizationId,
        },
      });

      if (!grant) {
        return NextResponse.json(
          { error: "Grant not found or doesn't belong to this organization" },
          { status: 404 }
        );
      }
    }

    // Generate new slug if title changes
    let updateData: any = { ...validatedData };

    if (validatedData.title && validatedData.title !== existingRfp.title) {
      let baseSlug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      let slug = baseSlug;
      let counter = 1;

      // Check if slug exists and append number if needed
      while (
        await database.rFP.findFirst({
          where: {
            slug,
            NOT: { id: (await params).rfpId },
          },
        })
      ) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      updateData.slug = slug;
    }

    // Handle publishedAt date
    if (
      validatedData.visibility === "PUBLISHED" &&
      existingRfp.visibility !== "PUBLISHED"
    ) {
      updateData.publishedAt = new Date();
    } else if (
      validatedData.visibility !== "PUBLISHED" &&
      existingRfp.visibility === "PUBLISHED"
    ) {
      updateData.publishedAt = null;
    }

    // Update the RFP
    const updatedRfp = await database.rFP.update({
      where: {
        id: (await params).rfpId,
      },
      data: updateData,
      include: {
        grant: {
          select: {
            id: true,
            title: true,
            slug: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            votes: true,
            applications: true,
          },
        },
      },
    });

    return NextResponse.json({ rfp: updatedRfp });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating RFP:", error);
    return NextResponse.json(
      { error: "Failed to update RFP" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/organizations/[organizationId]/rfps/[rfpId] - Delete RFP
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; rfpId: string }> }
) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to delete RFPs
    const member = await database.member.findFirst({
      where: {
        organizationId: (await params).organizationId,
        userId: sessionData.user.id,
        role: {
          in: ["owner", "admin"],
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if the RFP belongs to this organization
    const existingRfp = await database.rFP.findFirst({
      where: {
        id: (await params).rfpId,
        grant: {
          organizationId: (await params).organizationId,
        },
      },
    });

    if (!existingRfp) {
      return NextResponse.json(
        { error: "RFP not found or doesn't belong to this organization" },
        { status: 404 }
      );
    }

    // Delete the RFP
    await database.rFP.delete({
      where: {
        id: (await params).rfpId,
      },
    });

    return NextResponse.json({ message: "RFP deleted successfully" });
  } catch (error) {
    console.error("Error deleting RFP:", error);
    return NextResponse.json(
      { error: "Failed to delete RFP" },
      { status: 500 }
    );
  }
}
