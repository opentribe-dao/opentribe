import type { Prisma } from "@packages/db";
import { database } from "@packages/db";
import { type NextRequest, NextResponse } from "next/server";
import { ViewManager } from "@/lib/views";
import { auth } from "@packages/auth/server";
import { headers } from "next/headers";
import { getOrganizationAuth } from "@/lib/organization-auth";

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

// GET /api/v1/bounties/[id] - Get bounty details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const bountyId = (await params).id;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Try to find by ID first, then by slug
    const bounty = await database.bounty.findFirst({
      where: {
        OR: [{ id: bountyId }, { slug: bountyId }],
        visibility: "PUBLISHED",
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
              notIn: ["DRAFT", "SPAM"], // Show all non-draft, non-spam submissions
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
            responses: true, // Include screening question responses
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
            { isWinner: "desc" }, // Winners first
            { position: "asc" }, // Then by position
            { createdAt: "desc" }, // Then by creation date
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

    // Record view using ViewManager (userId preferred, else ip)
    const ip = ViewManager.extractClientIp(request as any);
    const vm = session?.user?.id
      ? new ViewManager({ userId: session.user.id })
      : ip
        ? new ViewManager({ userIp: ip })
        : null;
    if (vm) {
      await vm.recordViewForEntity(`bounty:${bounty.id}`);
    }

    // Show all submissions after deadline has passed
    // Before deadline, submissions are private and mutable
    if (bounty.deadline && new Date() < bounty.deadline) {
      // If winners haven't been announced, don't show any submissions publicly
      bounty.submissions = [];
    }
    // If winners have been announced, all submissions are already included from the query

    const response: GetBountyResponse = {
      bounty: {
        ...bounty,
        userSubmissionId: null,
        canSubmit: true,
      },
    };

    if (session?.user) {
      // Check if user is a member of the bounty org using organization-auth helper
      const orgAuth = await getOrganizationAuth(request, bounty.organizationId);

      // Check if user already submitted
      const userSubmission = await database.submission.findFirst({
        where: {
          bountyId: bounty.id,
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      });

      if (userSubmission) {
        response.bounty.userSubmissionId = userSubmission.id;
        response.bounty.canSubmit = false;
      } else if (orgAuth) {
        // User is a member of the organization, can't submit to own org's bounties
        response.bounty.canSubmit = false;
      } else {
        // User is not a member, can submit
        response.bounty.canSubmit = true;
      }
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

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
  });
}
