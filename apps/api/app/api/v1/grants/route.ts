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
    const sort = searchParams.get("sort") || "newest"; // newest, oldest, max_amount, min_amount, max_funds, most_applications, most_rfps
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");

    // Parse skills array - handle URL encoded comma-separated values
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

    // Parse status filter as a list (like bounties)
    const statusParam = searchParams.get("status");
    const rawStatuses = statusParam
      ? decodeURIComponent(statusParam)
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.toLowerCase())
      : [];

    // Validate against GrantStatus enum values
    const allowedStatuses = new Set(["OPEN", "CLOSED"]);
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

    // Filter by status (multiple values) - default to OPEN if no status provided
    if (statuses.length > 0) {
      whereClause.status = {
        in: statuses,
      };
    } else {
      // Default to open grants for homepage if status not supplied
      whereClause.status = "OPEN";
    }

    // Filter by skills (array intersection)
    if (uniqueSkills.length > 0) {
      whereClause.skills = {
        hasSome: uniqueSkills,
      };
    }

    // Filter by amount range - check for overlap with grant's minAmount and maxAmount
    if (minAmount || maxAmount) {
      const minAmountNum = minAmount ? Number.parseFloat(minAmount) : null;
      const maxAmountNum = maxAmount ? Number.parseFloat(maxAmount) : null;

      // Check for range overlap: grant range overlaps with filter range
      const rangeConditions: any[] = [];

      if (minAmountNum !== null && maxAmountNum !== null) {
        // Both min and max provided - check for overlap
        rangeConditions.push({
          OR: [
            // Grant's minAmount is within filter range
            {
              AND: [
                { minAmountUSD: { gte: minAmountNum } },
                { minAmountUSD: { lte: maxAmountNum } },
              ],
            },
            // Grant's maxAmount is within filter range
            {
              AND: [
                { maxAmountUSD: { gte: minAmountNum } },
                { maxAmountUSD: { lte: maxAmountNum } },
              ],
            },
            // Grant range encompasses filter range
            {
              AND: [
                { minAmountUSD: { lte: minAmountNum } },
                { maxAmountUSD: { gte: maxAmountNum } },
              ],
            },
          ],
        });
      } else if (minAmountNum !== null) {
        // Only min provided - grant's maxAmount should be >= filter min
        rangeConditions.push({
          OR: [
            { maxAmountUSD: { gte: minAmountNum } },
            { maxAmount: null }, // Handle cases where maxAmount is not set
          ],
        });
      } else if (maxAmountNum !== null) {
        // Only max provided - grant's minAmount should be <= filter max
        rangeConditions.push({
          OR: [
            { minAmountUSD: { lte: maxAmountNum } },
            { minAmount: null }, // Handle cases where minAmount is not set
          ],
        });
      }

      if (rangeConditions.length > 0) {
        whereClause.AND = whereClause.AND || [];
        whereClause.AND.push(...rangeConditions);
      }
    }

    // Add search functionality
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { skills: { hasSome: [search] } },
        {
          organization: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Determine sort order - case insensitive
    let orderBy: any = { publishedAt: "desc" }; // Default to NEWEST
    const sortUpper = sort.toUpperCase();

    switch (sortUpper) {
      case "OLDEST":
        orderBy = { publishedAt: "asc" };
        break;
      case "MAX_AMOUNT":
        orderBy = { maxAmountUSD: "desc" };
        break;
      case "MIN_AMOUNT":
        orderBy = { minAmountUSD: "asc" };
        break;
      case "MAX_FUNDS":
        orderBy = { totalFundsUSD: "desc" };
        break;
      case "MOST_APPLICATIONS":
        orderBy = { applicationCount: "desc" };
        break;
      case "MOST_RFPs":
        orderBy = { rfpCount: "desc" };
        break;
      case "NEWEST":
      default:
        orderBy = { publishedAt: "desc" };
    }

    const grants = await database.grant.findMany({
      where: whereClause,
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
      orderBy,
      take: limit + 1,
      skip: (page - 1) * limit,
    });

    const hasMore = grants.length > limit;

    if (hasMore) {
      grants.pop();
    }

    const transformedGrants = grants.map((grant) => ({
      ...grant,
      minAmount: grant.minAmount
        ? Number.parseFloat(grant.minAmount.toString())
        : undefined,
      maxAmount: grant.maxAmount
        ? Number.parseFloat(grant.maxAmount.toString())
        : undefined,
      totalFunds: grant.totalFunds
        ? Number.parseFloat(grant.totalFunds.toString())
        : undefined,
    }));

    return NextResponse.json(
      {
        grants: transformedGrants,
        pagination: {
          page,
          limit,
          hasMore,
        },
        filters: {
          search,
          skills: uniqueSkills,
          statuses,
          sort,
          minAmount,
          maxAmount,
        },
      },
      {
        headers: {
          "Cache-Control": "max-age=120",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching grants:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch grants",
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
