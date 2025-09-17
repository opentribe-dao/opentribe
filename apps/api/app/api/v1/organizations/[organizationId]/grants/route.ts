import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Query params schema
const queryParamsSchema = z.object({
  limit: z.string().transform(Number).default("10"),
  offset: z.string().transform(Number).default("0"),
  status: z.enum(["OPEN", "PAUSED", "CLOSED", "ALL"]).default("ALL"),
  visibility: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "ALL"]).default("ALL"),
  source: z.enum(["NATIVE", "EXTERNAL", "ALL"]).default("ALL"),
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
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    const { organizationId } = await params;

    // Check if user is a member of the organization
    const membership = await database.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: organizationId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        {
          status: 403,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status") || "ALL";
    const visibility = searchParams.get("visibility") || "ALL";
    const source = searchParams.get("source") || "ALL";
    const search = searchParams.get("search") || "";

    // Build where clause
    const whereClause: any = {
      organizationId: organizationId,
    };

    if (status !== "ALL") {
      whereClause.status = status;
    }

    if (visibility !== "ALL") {
      whereClause.visibility = visibility;
    }

    if (source !== "ALL") {
      whereClause.source = source;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const total = await database.grant.count({
      where: whereClause,
    });

    // Fetch grants with relations
    const grants = await database.grant.findMany({
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
        applications: {
          where: {
            status: "APPROVED",
          },
          select: {
            id: true,
            budget: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Add statistics to each grant
    const grantsWithStats = grants.map((grant) => {
      const approvedBudgets = grant.applications
        .filter((app) => app.budget)
        .map((app) => Number(app.budget));

      const totalApproved = approvedBudgets.reduce(
        (sum, budget) => sum + budget,
        0
      );
      const totalFunds = grant.totalFunds ? Number(grant.totalFunds) : 0;
      const remainingFunds = totalFunds - totalApproved;

      return {
        ...grant,
        stats: {
          applicationsCount: grant._count.applications,
          rfpsCount: grant._count.rfps,
          curatorsCount: grant._count.curators,
          approvedApplicationsCount: grant.applications.length,
          totalApprovedAmount: totalApproved,
          remainingFunds: remainingFunds > 0 ? remainingFunds : 0,
          fundingProgress:
            totalFunds > 0 ? (totalApproved / totalFunds) * 100 : 0,
        },
      };
    });

    return NextResponse.json(
      {
        grants: grantsWithStats,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching organization grants:", error);
    return NextResponse.json(
      { error: "Failed to fetch grants" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
