import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for grant update
const updateGrantSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  summary: z.string().optional(),
  instructions: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  skills: z.array(z.string()).optional(),
  minAmount: z.number().positive().optional().nullable(),
  maxAmount: z.number().positive().optional().nullable(),
  totalFunds: z.number().positive().optional().nullable(),
  token: z.string().optional(),
  resources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().url(),
        description: z.string().optional(),
      })
    )
    .optional(),
  screening: z
    .array(
      z.object({
        question: z.string(),
        type: z.enum(["text", "url", "file"]),
        optional: z.boolean(),
      })
    )
    .optional(),
  applicationUrl: z.string().url().optional().nullable(),
  visibility: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  status: z.enum(["OPEN", "PAUSED", "CLOSED"]).optional(),
  source: z.enum(["NATIVE", "EXTERNAL"]).optional(),
});

// GET /api/v1/grants/[id] - Get grant details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const grantId = (await params).id;

    // Try to find by ID first, then by slug
    const grant = await database.grant.findFirst({
      where: {
        OR: [{ id: grantId }, { slug: grantId }],
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            location: true,
            industry: true,
          },
        },
        _count: {
          select: {
            applications: true,
            rfps: true,
            curators: true,
          },
        },
        curators: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        rfps: {
          where: {
            visibility: "PUBLISHED",
          },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            _count: {
              select: {
                votes: true,
                comments: true,
                applications: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
        applications: {
          where: {
            status: {
              not: "DRAFT",
            },
          },
          select: {
            id: true,
            title: true,
            status: true,
            budget: true,
            submittedAt: true,
            applicant: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            submittedAt: "desc",
          },
          take: 5,
        },
      },
    });

    if (!grant) {
      return NextResponse.json(
        { error: "Grant not found" },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    // Increment view count
    await database.grant.update({
      where: { id: grant.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(
      { grant },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching grant:", error);
    return NextResponse.json(
      { error: "Failed to fetch grant" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}

// PATCH /api/v1/grants/[id] - Update grant
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const grantId = (await params).id;

    // Get the grant and check permissions
    // Try to find by ID first, then by slug
    const grant = await database.grant.findFirst({
      where: {
        OR: [{ id: grantId }, { slug: grantId }],
      },
      include: {
        organization: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                role: {
                  in: ["owner", "admin"],
                },
              },
            },
          },
        },
      },
    });

    if (!grant) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }

    if (grant.organization.members.length === 0) {
      return NextResponse.json(
        { error: "You do not have permission to update this grant" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateGrantSchema.parse(body);

    // Validate amount logic
    if (
      validatedData.minAmount &&
      validatedData.maxAmount &&
      validatedData.minAmount > validatedData.maxAmount
    ) {
      return NextResponse.json(
        { error: "Minimum amount cannot be greater than maximum amount" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (validatedData.title !== undefined)
      updateData.title = validatedData.title;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.summary !== undefined)
      updateData.summary = validatedData.summary;
    if (validatedData.instructions !== undefined)
      updateData.instructions = validatedData.instructions;
    if (validatedData.logoUrl !== undefined)
      updateData.logoUrl = validatedData.logoUrl;
    if (validatedData.bannerUrl !== undefined)
      updateData.bannerUrl = validatedData.bannerUrl;
    if (validatedData.skills !== undefined)
      updateData.skills = validatedData.skills;
    if (validatedData.minAmount !== undefined)
      updateData.minAmount = validatedData.minAmount;
    if (validatedData.maxAmount !== undefined)
      updateData.maxAmount = validatedData.maxAmount;
    if (validatedData.totalFunds !== undefined)
      updateData.totalFunds = validatedData.totalFunds;
    if (validatedData.token !== undefined)
      updateData.token = validatedData.token;
    if (validatedData.resources !== undefined)
      updateData.resources = validatedData.resources;
    if (validatedData.screening !== undefined)
      updateData.screening = validatedData.screening;
    if (validatedData.applicationUrl !== undefined)
      updateData.applicationUrl = validatedData.applicationUrl;
    if (validatedData.source !== undefined)
      updateData.source = validatedData.source;
    if (validatedData.visibility !== undefined) {
      updateData.visibility = validatedData.visibility;
      // Update publishedAt if changing from DRAFT to PUBLISHED
      if (
        grant.visibility === "DRAFT" &&
        validatedData.visibility === "PUBLISHED" &&
        !grant.publishedAt
      ) {
        updateData.publishedAt = new Date();
      }
    }
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;

    // Update the grant
    const updatedGrant = await database.grant.update({
      where: { id: grantId },
      data: updateData,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        _count: {
          select: {
            applications: true,
            rfps: true,
            curators: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        grant: updatedGrant,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Grant update error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update grant" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/grants/[id] - Delete grant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const grantId = (await params).id;

    // Get the grant and check permissions
    // Try to find by ID first, then by slug
    const grant = await database.grant.findFirst({
      where: {
        OR: [{ id: grantId }, { slug: grantId }],
      },
      include: {
        organization: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                role: {
                  in: ["owner", "admin"],
                },
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!grant) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }

    if (grant.organization.members.length === 0) {
      return NextResponse.json(
        { error: "You do not have permission to delete this grant" },
        { status: 403 }
      );
    }

    // Don't allow deletion if there are applications
    if (grant._count.applications > 0) {
      return NextResponse.json(
        { error: "Cannot delete a grant with applications" },
        { status: 400 }
      );
    }

    // Delete the grant
    await database.grant.delete({
      where: { id: grantId },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Grant deleted successfully",
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Grant deletion error:", error);

    return NextResponse.json(
      { error: "Failed to delete grant" },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
