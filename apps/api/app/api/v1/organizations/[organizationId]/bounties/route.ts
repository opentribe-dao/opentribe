import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Query params schema
const queryParamsSchema = z.object({
  limit: z.string().transform(Number).default(10),
  offset: z.string().transform(Number).default(0),
  status: z
    .enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ALL"])
    .default("ALL"),
  visibility: z.enum(["DRAFT", "PUBLISHED", "ALL"]).default("ALL"),
  search: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await params;

    // Check if user is a member of the organization
    const membership = await database.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        {
          status: 403,
        }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const offset = Number.parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status") || "ALL";
    const visibility = searchParams.get("visibility") || "ALL";
    const search = searchParams.get("search") || "";

    // Build where clause
    const whereClause: any = {
      organizationId,
    };

    if (status !== "ALL") {
      whereClause.status = status;
    }

    if (visibility !== "ALL") {
      whereClause.visibility = visibility;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const total = await database.bounty.count({
      where: whereClause,
    });

    // Fetch bounties with relations
    const bounties = await database.bounty.findMany({
      where: whereClause,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
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
            isWinner: true,
          },
          select: {
            id: true,
            isWinner: true,
            position: true,
            winningAmount: true,
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Add statistics to each bounty
    const bountiesWithStats = bounties.map((bounty) => {
      const winnersCount = bounty.submissions.filter((s) => s.isWinner).length;
      const maxWinners = Object.keys(bounty.winnings || {}).length;
      const totalDistributed = bounty.submissions
        .filter((s) => s.isWinner && s.winningAmount)
        .reduce((sum, s) => sum + Number(s.winningAmount), 0);

      return {
        ...bounty,
        stats: {
          submissionsCount: bounty._count.submissions,
          commentsCount: bounty._count.comments,
          winnersCount,
          maxWinners,
          totalDistributed,
          remainingSlots: maxWinners - winnersCount,
        },
      };
    });

    return NextResponse.json({
      bounties: bountiesWithStats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching organization bounties:", error);
    return NextResponse.json(
      { error: "Failed to fetch bounties" },
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
