import { database } from "@packages/db";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/v1/ecosystem/profiles - List ecosystem profiles with pagination, search, and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const page = Number.parseInt(searchParams.get("page") || "1");
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "20");
    const skip = (page - 1) * pageSize;

    // Parse search query
    const query = searchParams.get("query") || "";

    // Parse filters
    const source = searchParams.get("source");
    const claimStatus = searchParams.get("claimStatus"); // "claimed" | "unclaimed"

    // Parse skills array
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
    const uniqueSkills = [...new Set(skills)];

    // Parse sort
    const sort = searchParams.get("sort") || "newest"; // newest, oldest

    // Build where clause
    const whereClause: any = {};

    // Search by displayName, github, or slug
    if (query) {
      whereClause.OR = [
        { displayName: { contains: query, mode: "insensitive" } },
        { github: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
      ];
    }

    // Filter by source
    if (source) {
      whereClause.source = source;
    }

    // Filter by claim status
    if (claimStatus === "claimed") {
      whereClause.claimedByUserId = { not: null };
    } else if (claimStatus === "unclaimed") {
      whereClause.claimedByUserId = null;
    }

    // Filter by skills
    if (uniqueSkills.length > 0) {
      whereClause.skills = {
        hasSome: uniqueSkills,
      };
    }

    // Determine sort order
    const sortUpper = sort.toUpperCase();
    let orderBy: any = { createdAt: "desc" };
    if (sortUpper === "OLDEST") {
      orderBy = { createdAt: "asc" };
    }

    const [profiles, total] = await Promise.all([
      database.ecosystemProfile.findMany({
        where: whereClause,
        select: {
          id: true,
          displayName: true,
          slug: true,
          email: true,
          github: true,
          twitter: true,
          linkedin: true,
          website: true,
          telegram: true,
          walletAddresses: true,
          onChainName: true,
          onChainVerified: true,
          bio: true,
          skills: true,
          location: true,
          source: true,
          claimedByUserId: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              contributions: true,
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      database.ecosystemProfile.count({ where: whereClause }),
    ]);

    // Transform to include claimStatus field
    const transformedProfiles = profiles.map((profile) => ({
      ...profile,
      claimStatus: profile.claimedByUserId ? "claimed" : "unclaimed",
      contributionCount: profile._count.contributions,
      // Remove internal fields
      claimedByUserId: undefined,
      _count: undefined,
    }));

    return NextResponse.json(
      {
        profiles: transformedProfiles,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        filters: {
          query,
          source,
          claimStatus,
          skills: uniqueSkills,
          sort,
        },
      },
      {
        headers: {
          "Cache-Control": "max-age=120",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching ecosystem profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch ecosystem profiles" },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
  });
}
