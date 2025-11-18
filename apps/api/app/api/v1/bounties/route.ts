import { database } from "@packages/db";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/v1/bounties - Get bounties
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const page = Number.parseInt(searchParams.get("page") || "1");
    // Parse search and filters
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "publishedAt";
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const hasSubmissions = searchParams.get("hasSubmissions");
    const hasDeadline = searchParams.get("hasDeadline");

    // Parse skills array - handle URL encoded comma-separated values
    // Support 'skills' parameters
    const skillsParam = searchParams.get("skills");
    const skills: string[] = [];

    if (skillsParam) {
      skills.push(
        ...decodeURIComponent(skillsParam)
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s)
      );
    }

    // Remove duplicates
    const uniqueSkills = [...new Set(skills)];

    const statusParam = searchParams.get("status");

    const rawStatuses = statusParam
      ? decodeURIComponent(statusParam)
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.toLowerCase())
      : [];

    // Validate against BountyStatus enum values
    const allowedStatuses = new Set([
      "OPEN",
      "REVIEWING",
      "COMPLETED",
      "CLOSED",
      "CANCELLED",
    ]);
    const statuses = Array.from(
      new Set(
        rawStatuses
          .map((s) => s.trim().toUpperCase())
          .filter((s) => allowedStatuses.has(s))
      )
    );

    // Build where clause
    const whereClause: any = {
      visibility: "PUBLISHED",
    };

    // Filter by status (multiple values)
    if (statuses.length > 0) {
      whereClause.status = {
        in: statuses,
      };
    }

    // Filter by skills (array intersection)
    if (uniqueSkills.length > 0) {
      whereClause.skills = {
        hasSome: uniqueSkills,
      };
    }

    // Filter by amount range
    if (minAmount || maxAmount) {
      whereClause.amountUSD = {};
      if (minAmount) {
        const minAmountNum = Number.parseFloat(minAmount);
        if (!isNaN(minAmountNum)) {
          whereClause.amountUSD.gte = minAmountNum;
        }
      }
      if (maxAmount) {
        const maxAmountNum = Number.parseFloat(maxAmount);
        if (!isNaN(maxAmountNum)) {
          whereClause.amountUSD.lte = maxAmountNum;
        }
      }
    }

    // Filter by submissions
    if (hasSubmissions === "true") {
      // {"error":"Failed to fetch bounties","details":"Cannot set properties of undefined (setting 'gte')"}
      // whereClause.submissionCount.gte = 1;
      whereClause.submissionCount = 1;
    } else if (hasSubmissions === "false") {
      // {"error":"Failed to fetch bounties","details":"Cannot set properties of undefined (setting 'lte')"}
      // whereClause.submissionCount.lte = 0;
      whereClause.submissionCount = 0;
    }

    // Filter by deadline
    if (hasDeadline === "true") {
      whereClause.deadline = {
        not: null,
      };
    }

    // Add search functionality
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { skills: { hasSome: [search] } },
        {
          organization: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Determine sort order
    let orderBy: any = { publishedAt: "desc" };
    switch (sort) {
      case "views":
        orderBy = { viewCount: "desc" };
        break;
      case "amount":
        orderBy = { amountUSD: "desc" };
        break;
      case "amount_high":
        orderBy = { amountUSD: "desc" };
        break;
      case "amount_low":
        orderBy = { amountUSD: "asc" };
        break;
      case "deadline":
        orderBy = [{ deadline: { sort: "asc", nulls: "last" } }];
        break;
      case "submissions":
        orderBy = { submissionCount: "desc" };
        break;
      case "newest":
        orderBy = { publishedAt: "desc" };
        break;
      case "oldest":
        orderBy = { publishedAt: "asc" };
        break;
      case "created":
        orderBy = { createdAt: "desc" };
        break;
      default:
        orderBy = { publishedAt: "desc" };
    }

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
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy,
    });

    // Get total count for pagination
    const totalCount = await database.bounty.count({
      where: whereClause,
    });

    return NextResponse.json(
      {
        bounties,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        filters: {
          search,
          skills: uniqueSkills,
          statuses,
          sort,
          minAmount,
          maxAmount,
          hasSubmissions,
          hasDeadline,
        },
      },
      {
        headers: {
          "Cache-Control": "max-age=120",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching bounties:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch bounties",
        details: error instanceof Error ? error.message : "Unknown error",
      },
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
