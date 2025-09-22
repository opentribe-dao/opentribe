import { database } from "@packages/db";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const page = Number.parseInt(searchParams.get("page") || "1");

    // Parse search and filters
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "recent";
    const applicationCount = searchParams.get("applicationCount");

    // Parse status filter as a list (like grants)
    const statusParam = searchParams.get("status");
    const rawStatuses = statusParam
      ? decodeURIComponent(statusParam)
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.toLowerCase())
      : [];

    // Validate against RFPStatus enum values
    const allowedStatuses = new Set(["OPEN", "PAUSED", "CLOSED"]);
    const statuses = Array.from(
      new Set(
        rawStatuses
          .map((s) => s.trim().toUpperCase())
          .filter((s) => allowedStatuses.has(s))
      )
    );

    // Build where clause with default constraints
    const whereClause: any = {
      visibility: "PUBLISHED",
    };

    // Filter by status (multiple values) - default to OPEN if no status provided
    if (statuses.length > 0) {
      whereClause.status = {
        in: statuses,
      };
    } else {
      // Default to open RFPs if status not supplied
      whereClause.status = "OPEN";
    }

    // Add enhanced search functionality
    if (search) {
      whereClause.OR = [
        // Search in RFP fields
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        // Search in organization fields
        {
          grant: {
            organization: {
              name: { contains: search, mode: "insensitive" },
            },
          },
        },
        {
          grant: {
            organization: {
              location: { contains: search, mode: "insensitive" },
            },
          },
        },
        // Search in grant fields
        {
          grant: {
            title: { contains: search, mode: "insensitive" },
          },
        },
        {
          grant: {
            description: { contains: search, mode: "insensitive" },
          },
        },
        {
          grant: {
            summary: { contains: search, mode: "insensitive" },
          },
        },
        {
          grant: {
            skills: { hasSome: [search] },
          },
        },
      ];
    }

    // Determine sort order - case insensitive
    let orderBy: any = { publishedAt: "desc" }; // Default to recent
    const sortUpper = sort.toUpperCase();

    // Handle popular sorting (by voteCount) vs recent sorting (by publishedAt)
    const needsPopularSort = sortUpper === "POPULAR";
    const needsApplicationCountSort =
      applicationCount &&
      (applicationCount.toLowerCase() === "highest" ||
        applicationCount.toLowerCase() === "lowest");

    if (needsPopularSort) {
      orderBy = { voteCount: "desc" };
    } else {
      // Default to recent (publishedAt desc)
      orderBy = { publishedAt: "desc" };
    }

    const rfps = await database.rFP.findMany({
      where: whereClause,
      include: {
        grant: {
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
          },
        },
        _count: {
          select: {
            applications: {
              where: {
                status: {
                  in: ["SUBMITTED", "APPROVED", "REJECTED"],
                },
              },
            },
            comments: true,
          },
        },
      },
      orderBy: needsApplicationCountSort ? undefined : orderBy,
      take: needsApplicationCountSort ? undefined : limit + 1,
      skip: needsApplicationCountSort ? undefined : (page - 1) * limit,
    });

    // Handle application count sorting in memory if needed
    let sortedRfps = rfps;
    if (needsApplicationCountSort) {
      sortedRfps = rfps.sort((a, b) => {
        const countA = a._count.applications;
        const countB = b._count.applications;
        return applicationCount.toLowerCase() === "highest"
          ? countB - countA
          : countA - countB;
      });

      // Apply pagination after sorting
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit + 1;
      sortedRfps = sortedRfps.slice(startIndex, endIndex);
    }

    let hasMore = sortedRfps.length > limit;

    if (hasMore) {
      sortedRfps.pop();
    }

    const transformedRfps = sortedRfps.map((rfp) => ({
      ...rfp,
      applicationCount: rfp._count.applications,
      commentCount: rfp._count.comments,
    }));

    return NextResponse.json(
      {
        rfps: transformedRfps,
        pagination: {
          page,
          limit,
          hasMore: hasMore,
        },
        filters: {
          search,
          statuses,
          sort,
          applicationCount,
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "max-age=120",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching RFPs:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch RFPs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
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
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}