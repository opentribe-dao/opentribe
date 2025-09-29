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

    // Determine sort order using switch case, case insensitive
    let orderBy: any = { publishedAt: "desc" }; // Default to recent
    const sortLower = sort.toLowerCase();

    switch (sortLower) {
      case "popular":
        orderBy = { voteCount: "desc" };
        break;
      case "most_applications":
        orderBy = { applicationCount: "desc" };
        break;
      case "least_applications":
        orderBy = { applicationCount: "asc" };
        break;
      case "recent":
      default:
        orderBy = { publishedAt: "desc" };
        break;
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
      },
      orderBy: orderBy,
      take: limit + 1,
      skip: (page - 1) * limit,
    });

    let hasMore = rfps.length > limit;

    if (hasMore) {
      rfps.pop();
    }

    return NextResponse.json({
      rfps: rfps,
      pagination: {
        page,
        limit,
        hasMore: hasMore,
      },
      filters: {
        search,
        statuses,
        sort,
      },
    });
  } catch (error) {
    console.error("Error fetching RFPs:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch RFPs",
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
