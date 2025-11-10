import { auth } from "@packages/auth/server";
import type { Prisma } from "@packages/db";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { ViewManager } from "@/lib/views";

// Type for GET API response
type RFPWithRelations = Prisma.RFPGetPayload<{
  include: {
    grant: {
      select: {
        id: true;
        slug: true;
        title: true;
        logoUrl: true;
        minAmount: true;
        maxAmount: true;
        token: true;
        organization: {
          select: {
            id: true;
            name: true;
            logo: true;
            slug: true;
            isVerified: true;
          };
        };
        source: true;
        applicationUrl: true;
        status: true;
      };
    };
    comments: {
      include: {
        author: {
          select: {
            id: true;
            firstName: true;
            lastName: true;
            image: true;
            username: true;
          };
        };
        replies: {
          include: {
            author: {
              select: {
                id: true;
                firstName: true;
                lastName: true;
                image: true;
                username: true;
              };
            };
          };
        };
      };
    };
    votes: {
      select: {
        userId: true;
        direction: true;
      };
    };
    _count: {
      select: {
        comments: true;
        votes: true;
        applications: true;
      };
    };
  };
}>;

type RelatedRFP = {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  commentCount: number;
  voteCount: number;
};

interface GetRFPResponse {
  rfp: RFPWithRelations & {
    userApplicationId: string | null;
    canApply: boolean;
  };
  relatedRfps: RelatedRFP[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Try to find by ID first, then by slug (case-insensitive)
    const rfp = await database.rFP.findFirst({
      where: {
        OR: [
          { id: (await params).id },
          {
            slug: {
              equals: (await params).id,
              mode: "insensitive",
            },
          },
        ],
        visibility: "PUBLISHED",
      },
      include: {
        grant: {
          select: {
            id: true,
            slug: true,
            title: true,
            logoUrl: true,
            minAmount: true,
            maxAmount: true,
            token: true,
            organization: {
              select: {
                id: true,
                name: true,
                logo: true,
                slug: true,
                isVerified: true,
              },
            },
            source: true,
            applicationUrl: true,
            status: true,
          },
        },
        comments: {
          where: {
            isHidden: false,
            parentId: null,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                image: true,
                username: true,
              },
            },
            replies: {
              where: {
                isHidden: false,
              },
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    image: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
        votes: {
          select: {
            userId: true,
            direction: true,
          },
        },
        _count: {
          select: {
            comments: {
              where: {
                isHidden: false,
              },
            },
            votes: {
              where: {
                direction: "UP",
              },
            },
            applications: true,
          },
        },
      },
    });

    if (!rfp) {
      console.log("RFP not found for ID/slug:", (await params).id);
      return NextResponse.json(
        { error: "RFP not found" },
        {
          status: 404,
        }
      );
    }

    // Get related RFPs from the same grant
    const relatedRfps = await database.rFP.findMany({
      where: {
        grantId: rfp.grantId,
        id: {
          not: rfp.id,
        },
        visibility: "PUBLISHED",
        status: "OPEN",
      },
      take: 3,
      orderBy: {
        viewCount: "desc",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        commentCount: true,
        voteCount: true,
      },
    });

    // Record view using ViewManager (userId preferred, else ip)
    const ip = ViewManager.extractClientIp(request as any);
    const vm = session?.user?.id
      ? new ViewManager({ userId: session.user.id })
      : ip
        ? new ViewManager({ userIp: ip })
        : null;
    if (vm) {
      await vm.recordViewForEntity(`rfp:${rfp.id}`);
    }

    const response: GetRFPResponse = {
      rfp: {
        ...rfp,
        userApplicationId: null,
        canApply: true,
      },
      relatedRfps,
    };

    if (session) {
      // Check if user is a member of the grant's organization
      const userMembership = await database.member.count({
        where: {
          organizationId: rfp.grant.organization.id,
          userId: session?.user?.id,
        },
      });

      // Check if user already applied
      const userApplication = session?.user
        ? await database.grantApplication.findFirst({
            where: {
              rfpId: rfp.id,
              userId: session.user.id,
            },
          })
        : null;

      if (userApplication) {
        response.rfp.userApplicationId = userApplication.id;
        response.rfp.canApply = false;
      } else if (userMembership !== undefined) {
        if (userMembership === 0) {
          response.rfp.canApply = true;
        } else {
          response.rfp.canApply = false;
        }
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching RFP:", error);
    return NextResponse.json(
      { error: "Failed to fetch RFP" },
      {
        status: 500,
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
  });
}
