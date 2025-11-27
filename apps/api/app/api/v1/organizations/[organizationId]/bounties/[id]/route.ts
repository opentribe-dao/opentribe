import { URL_REGEX } from "@packages/base/lib/utils";
import type { Prisma } from "@packages/db";
import { database } from "@packages/db";
import { formatZodError } from "@/lib/zod-errors";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationAuth, hasRequiredRole } from "@/lib/organization-auth";
import { ViewManager } from "@/lib/views";

// Type for GET API response
type BountyWithRelations = Prisma.BountyGetPayload<{
  include: {
    organization: {
      select: {
        id: true;
        name: true;
        slug: true;
        logo: true;
        location: true;
        industry: true;
      };
    };
    _count: {
      select: {
        submissions: true;
        comments: true;
      };
    };
    submissions: {
      select: {
        id: true;
        title: true;
        description: true;
        submissionUrl: true;
        position: true;
        winningAmount: true;
        isWinner: true;
        createdAt: true;
        responses: true;
        status: true;
        likesCount: true;
        submitter: {
          select: {
            id: true;
            username: true;
            firstName: true;
            lastName: true;
            image: true;
          };
        };
      };
    };
    comments: {
      include: {
        author: {
          select: {
            id: true;
            username: true;
            firstName: true;
            lastName: true;
            image: true;
          };
        };
        replies: {
          include: {
            author: {
              select: {
                id: true;
                username: true;
                firstName: true;
                lastName: true;
                image: true;
              };
            };
          };
        };
      };
    };
  };
}>;

interface GetBountyResponse {
  bounty: BountyWithRelations & {
    userSubmissionId: string | null;
    canSubmit: boolean;
  };
}

// Schema for bounty update
const updateBountySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  skills: z.array(z.string()).optional(),
  amount: z.number().positive().optional(),
  token: z.string().optional(),
  split: z.enum(["FIXED", "EQUAL_SPLIT", "VARIABLE"]).optional(),
  winnings: z.record(z.string(), z.number()).optional(),
  deadline: z.string().datetime().optional(),
  resources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().regex(URL_REGEX),
        description: z.string().optional(),
      })
    )
    .optional(),
  screening: z
    .array(
      z.object({
        question: z.string(),
        type: z.enum(["text", "url", "file", "boolean"]),
        optional: z.boolean(),
      })
    )
    .optional(),
  visibility: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  status: z
    .enum(["OPEN", "REVIEWING", "COMPLETED", "CLOSED", "CANCELLED"])
    .optional(),
});

// GET /api/v1/organizations/[organizationId]/bounties/[id] - Get bounty details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; id: string }> }
) {
  try {
    const { organizationId, id: bountyId } = await params;

    // Get auth (middleware already validated membership)
    const orgAuth = await getOrganizationAuth(request, organizationId);
    if (!orgAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to find by ID first, then by slug
    const bounty = await database.bounty.findFirst({
      where: {
        OR: [{ id: bountyId }, { slug: bountyId }],
        organizationId, // Ensure bounty belongs to organization
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
            submissions: true,
            comments: true,
          },
        },
        submissions: {
          where: {
            status: {
              notIn: ["DRAFT", "WITHDRAWN"],
            },
          },
          select: {
            id: true,
            title: true,
            description: true,
            submissionUrl: true,
            position: true,
            winningAmount: true,
            isWinner: true,
            createdAt: true,
            responses: true,
            status: true,
            likesCount: true,
            submitter: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                image: true,
              },
            },
          },
          orderBy: [
            { isWinner: "desc" },
            { status: "asc" },
            { position: "asc" },
            { createdAt: "desc" },
          ],
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                image: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    image: true,
                  },
                },
              },
            },
          },
          where: {
            parentId: null,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        },
      },
    });

    if (!bounty) {
      return NextResponse.json(
        { error: "Bounty not found" },
        {
          status: 404,
        }
      );
    }

    // Record view using ViewManager
    const ip = ViewManager.extractClientIp(request as any);
    const vm = orgAuth.userId
      ? new ViewManager({ userId: orgAuth.userId })
      : ip
        ? new ViewManager({ userIp: ip })
        : null;
    if (vm) {
      await vm.recordViewForEntity(`bounty:${bounty.id}`);
    }

    // Show all submissions after deadline has passed
    if (bounty.deadline && new Date() < bounty.deadline) {
      bounty.submissions = [];
    }

    const response: GetBountyResponse = {
      bounty: {
        ...bounty,
        userSubmissionId: null,
        canSubmit: true,
      },
    };

    // Check if user already submitted
    const userSubmission = await database.submission.findFirst({
      where: {
        bountyId: bounty.id,
        userId: orgAuth.userId,
      },
    });

    if (userSubmission) {
      response.bounty.userSubmissionId = userSubmission.id;
      response.bounty.canSubmit = false;
    } else {
      // Members can't submit to their own org's bounties
      response.bounty.canSubmit = false;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching bounty:", error);
    return NextResponse.json(
      { error: "Failed to fetch bounty" },
      {
        status: 500,
      }
    );
  }
}

// PATCH /api/v1/organizations/[organizationId]/bounties/[id] - Update bounty
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; id: string }> }
) {
  try {
    const { organizationId, id: bountyId } = await params;

    // Get auth (middleware already validated membership)
    const orgAuth = await getOrganizationAuth(request, organizationId);
    if (!orgAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin/owner role
    const isOwnerOrAdmin = hasRequiredRole(orgAuth.membership, [
      "owner",
      "admin",
    ]);

    // Check if user is a curator for this bounty
    const isCurator = await database.curator.findFirst({
      where: {
        userId: orgAuth.userId,
        bounty: {
          OR: [
            { id: bountyId },
            { slug: { equals: bountyId, mode: "insensitive" } },
          ],
          organizationId,
        },
      },
    });

    if (!isOwnerOrAdmin && !isCurator) {
      return NextResponse.json(
        { error: "You do not have permission to update this bounty" },
        { status: 403 }
      );
    }

    // Get the bounty and verify it belongs to organization
    const bounty = await database.bounty.findFirst({
      where: {
        OR: [
          { id: bountyId },
          { slug: { equals: bountyId, mode: "insensitive" } },
        ],
        organizationId,
      },
    });

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateBountySchema.parse(body);

    // If curator (not admin/owner) and bounty is CLOSED, prevent editing critical fields
    if (!isOwnerOrAdmin && isCurator && bounty.status === "CLOSED") {
      if (
        validatedData.amount !== undefined ||
        validatedData.token !== undefined ||
        validatedData.split !== undefined ||
        validatedData.winnings !== undefined
      ) {
        return NextResponse.json(
          { error: "Curators cannot edit financial details of a closed bounty" },
          { status: 403 }
        );
      }
    }

    // Prepare update data
    const updateData: Prisma.BountyUpdateInput = {};

    if (validatedData.title !== undefined)
      updateData.title = validatedData.title;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.skills !== undefined)
      updateData.skills = validatedData.skills;
    if (validatedData.amount !== undefined)
      updateData.amount = validatedData.amount;
    if (validatedData.token !== undefined)
      updateData.token = validatedData.token;
    if (validatedData.split !== undefined)
      updateData.split = validatedData.split;
    if (validatedData.winnings !== undefined)
      updateData.winnings = validatedData.winnings;
    if (validatedData.deadline !== undefined)
      updateData.deadline = new Date(validatedData.deadline);
    if (validatedData.resources !== undefined)
      updateData.resources = validatedData.resources;
    if (validatedData.screening !== undefined)
      updateData.screening = validatedData.screening;
    if (validatedData.visibility !== undefined) {
      updateData.visibility = validatedData.visibility;
      if (
        bounty.visibility === "DRAFT" &&
        validatedData.visibility === "PUBLISHED" &&
        !bounty.publishedAt
      ) {
        updateData.publishedAt = new Date();
      }
    }
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;

    // Update the bounty
    const updatedBounty = await database.bounty.update({
      where: { id: bounty.id },
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
            submissions: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      bounty: updatedBounty,
    });
  } catch (error) {
    console.error("Bounty update error:", error);

    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error);
      return NextResponse.json(formattedError, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update bounty" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/organizations/[organizationId]/bounties/[id] - Delete bounty
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; id: string }> }
) {
  try {
    const { organizationId, id: bountyId } = await params;

    // Get auth (middleware already validated membership)
    const orgAuth = await getOrganizationAuth(request, organizationId);
    if (!orgAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin/owner role
    const isOwnerOrAdmin = hasRequiredRole(orgAuth.membership, [
      "owner",
      "admin",
    ]);

    // Check if user is a curator for this bounty
    const isCurator = await database.curator.findFirst({
      where: {
        userId: orgAuth.userId,
        bounty: {
          OR: [
            { id: bountyId },
            { slug: { equals: bountyId, mode: "insensitive" } },
          ],
          organizationId,
        },
      },
    });

    if (!isOwnerOrAdmin && !isCurator) {
      return NextResponse.json(
        { error: "You do not have permission to delete this bounty" },
        { status: 403 }
      );
    }

    // Get the bounty and verify it belongs to organization
    const bounty = await database.bounty.findFirst({
      where: {
        OR: [{ id: bountyId }, { slug: bountyId }],
        organizationId,
      },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    // Don't allow deletion if there are submissions
    if (bounty._count.submissions > 0) {
      return NextResponse.json(
        { error: "Cannot delete a bounty with submissions" },
        { status: 400 }
      );
    }

    // Delete the bounty
    await database.bounty.delete({
      where: { id: bounty.id },
    });

    return NextResponse.json({
      success: true,
      message: "Bounty deleted successfully",
    });
  } catch (error) {
    console.error("Bounty deletion error:", error);

    return NextResponse.json(
      { error: "Failed to delete bounty" },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
  });
}
