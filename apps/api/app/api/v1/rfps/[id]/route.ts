import { database } from "@packages/db";
import { auth } from "@packages/auth/server";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("Fetching RFP with ID or slug:", (await params).id);
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
      },
      include: {
        grant: {
          select: {
            id: true,
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

    // Increment view count
    await database.rFP.update({
      where: { id: rfp.id },
      data: { viewCount: { increment: 1 } },
    });

    // check if already applied
    const userApplication = session?.user
      ? await database.grantApplication.findFirst({
          where: {
            rfpId: rfp.id,
            userId: session.user.id,
          },
        })
      : null;

    // Add userApplicationId to the rfp object
    const rfpWithApplication = {
      ...rfp,
      userApplicationId: userApplication?.id || null,
    };

    return NextResponse.json({
      rfp: rfpWithApplication,
      relatedRfps,
    });
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
