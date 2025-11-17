import type { Prisma } from "@packages/db";
import { database } from "@packages/db";
import { type NextRequest, NextResponse } from "next/server";
import { ViewManager } from "@/lib/views";
import { auth } from "@packages/auth/server";
import { headers } from "next/headers";

// Type for GET API response
type GrantWithRelations = Prisma.GrantGetPayload<{
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
        applications: true;
        rfps: true;
        curators: true;
      };
    };
    curators: {
      include: {
        user: {
          select: {
            id: true;
            username: true;
            firstName: true;
            lastName: true;
            email: true;
            image: true;
          };
        };
      };
    };
    rfps: {
      select: {
        id: true;
        title: true;
        slug: true;
        status: true;
        _count: {
          select: {
            votes: true;
            comments: true;
            applications: true;
          };
        };
      };
    };
    applications: {
      select: {
        id: true;
        title: true;
        status: true;
        budget: true;
        submittedAt: true;
        applicant: {
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
}>;

interface GetGrantResponse {
  grant: GrantWithRelations & {
    userApplicationId: string | null;
    canApply: boolean;
  };
}

// GET /api/v1/grants/[id] - Get grant details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const grantId = (await params).id;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Try to find by ID first, then by slug
    const grant = await database.grant.findFirst({
      where: {
        OR: [
          { id: grantId },
          { slug: { equals: grantId, mode: "insensitive" } },
        ],
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
                image: true,
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
                image: true,
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
      await vm.recordViewForEntity(`grant:${grant.id}`);
    }

    const response: GetGrantResponse = {
      grant: {
        ...grant,
        userApplicationId: null,
        canApply: true,
      },
    };

    if (session) {
      // check if user is a member of the bounty org
      const userMembership = await database.member.count({
        where: {
          organizationId: grant.organizationId,
          userId: session?.user?.id,
        },
      });
      // check if user already applied
      const userApplication = session?.user
        ? await database.grantApplication.findFirst({
            where: {
              grantId: grant.id,
              userId: session.user.id,
            },
          })
        : null;

      if (userApplication) {
        response.grant.userApplicationId = userApplication.id;
        response.grant.canApply = false;
      } else if (userMembership !== undefined) {
        if (userMembership === 0) {
          response.grant.canApply = true;
        } else {
          response.grant.canApply = false;
        }
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching grant:", error);
    return NextResponse.json(
      { error: "Failed to fetch grant" },
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
