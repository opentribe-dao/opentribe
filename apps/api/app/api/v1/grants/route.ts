import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for grant creation
const createGrantSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  summary: z.string().optional(),
  instructions: z.string().optional(),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  skills: z.array(z.string()).default([]),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  totalFunds: z.number().positive().optional(),
  token: z.string().default("DOT"),
  resources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().url(),
        description: z.string().optional(),
      })
    )
    .optional(),
  screening: z
    .array(
      z.object({
        question: z.string(),
        type: z.enum(["text", "url", "file"]),
        optional: z.boolean(),
      })
    )
    .optional(),
  applicationUrl: z.string().url().optional(),
  visibility: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  source: z.enum(["NATIVE", "EXTERNAL"]).default("NATIVE"),
  organizationId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const page = Number.parseInt(searchParams.get("page") || "1");

    // Parse search and filters
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "NEWEST";
    const source = searchParams.get("source") || "ALL";
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const applicationCount = searchParams.get("applicationCount");

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

    // Filter by source
    if (source !== "ALL") {
      whereClause.source = source;
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
                { minAmount: { gte: minAmountNum } },
                { minAmount: { lte: maxAmountNum } },
              ],
            },
            // Grant's maxAmount is within filter range
            {
              AND: [
                { maxAmount: { gte: minAmountNum } },
                { maxAmount: { lte: maxAmountNum } },
              ],
            },
            // Grant range encompasses filter range
            {
              AND: [
                { minAmount: { lte: minAmountNum } },
                { maxAmount: { gte: maxAmountNum } },
              ],
            },
          ],
        });
      } else if (minAmountNum !== null) {
        // Only min provided - grant's maxAmount should be >= filter min
        rangeConditions.push({
          OR: [
            { maxAmount: { gte: minAmountNum } },
            { maxAmount: null }, // Handle cases where maxAmount is not set
          ],
        });
      } else if (maxAmountNum !== null) {
        // Only max provided - grant's minAmount should be <= filter max
        rangeConditions.push({
          OR: [
            { minAmount: { lte: maxAmountNum } },
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
      case "NEWEST":
        orderBy = { publishedAt: "desc" };
        break;
      case "OLDEST":
        orderBy = { publishedAt: "asc" };
        break;
      default:
        orderBy = { publishedAt: "desc" };
    }

    // For applicationCount sorting, we need to use a different approach
    // since we can't directly sort by computed fields in Prisma
    const needsApplicationCountSort =
      applicationCount &&
      (applicationCount.toLowerCase() === "highest" ||
        applicationCount.toLowerCase() === "lowest");

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
        _count: {
          select: {
            applications: {
              where: {
                status: {
                  in: ["SUBMITTED", "APPROVED", "REJECTED"],
                },
              },
            },
            rfps: true,
          },
        },
      },
      orderBy: needsApplicationCountSort ? undefined : orderBy,
      take: needsApplicationCountSort ? undefined : limit + 1,
      skip: needsApplicationCountSort ? undefined : (page - 1) * limit,
    });

    // Handle application count sorting in memory if needed
    let sortedGrants = grants;
    if (needsApplicationCountSort) {
      sortedGrants = grants.sort((a, b) => {
        const countA = a._count.applications;
        const countB = b._count.applications;
        return applicationCount.toLowerCase() === "highest"
          ? countB - countA
          : countA - countB;
      });

      // Apply pagination after sorting
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit + 1;
      sortedGrants = sortedGrants.slice(startIndex, endIndex);
    }

    let hasMore = sortedGrants.length > limit;

    if (hasMore) {
      sortedGrants.pop();
    }

    const transformedGrants = sortedGrants.map((grant) => ({
      ...grant,
      applicationCount: grant._count.applications,
      rfpCount: grant._count.rfps,
      minAmount: grant.minAmount
        ? parseFloat(grant.minAmount.toString())
        : undefined,
      maxAmount: grant.maxAmount
        ? parseFloat(grant.maxAmount.toString())
        : undefined,
    }));

    return NextResponse.json(
      {
        grants: transformedGrants,
        pagination: {
          page,
          limit,
          hasMore: hasMore,
        },
        filters: {
          search,
          skills: uniqueSkills,
          statuses,
          sort,
          source,
          minAmount,
          maxAmount,
          applicationCount,
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
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
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}

// POST /api/v1/grants - Create grant
export async function POST(request: NextRequest) {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createGrantSchema.parse(body);

    // Check if user is a member of the organization
    const membership = await database.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: validatedData.organizationId,
        role: {
          in: ["owner", "admin"], // Only owners and admins can create grants
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to create grants for this organization",
        },
        { status: 403 }
      );
    }

    // Validate amount logic
    if (
      validatedData.minAmount &&
      validatedData.maxAmount &&
      validatedData.minAmount > validatedData.maxAmount
    ) {
      return NextResponse.json(
        { error: "Minimum amount cannot be greater than maximum amount" },
        { status: 400 }
      );
    }

    // Generate a unique slug from the title
    let baseSlug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists and append number if needed
    while (await database.grant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the grant
    const grant = await database.grant.create({
      data: {
        title: validatedData.title,
        slug,
        description: validatedData.description,
        summary: validatedData.summary,
        instructions: validatedData.instructions,
        logoUrl: validatedData.logoUrl,
        bannerUrl: validatedData.bannerUrl,
        skills: validatedData.skills,
        minAmount: validatedData.minAmount,
        maxAmount: validatedData.maxAmount,
        totalFunds: validatedData.totalFunds,
        token: validatedData.token,
        resources: validatedData.resources || undefined,
        screening: validatedData.screening || undefined,
        applicationUrl: validatedData.applicationUrl,
        visibility: validatedData.visibility,
        source: validatedData.source,
        status: "OPEN",
        organizationId: validatedData.organizationId,
        publishedAt:
          validatedData.visibility === "PUBLISHED" ? new Date() : null,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        grant,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Grant creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create grant" },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}