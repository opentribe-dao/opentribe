import { auth } from "@packages/auth/server";
import { URL_REGEX } from "@packages/base/lib/utils";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for bounty creation
const createBountySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  skills: z.array(z.string()).min(1),
  amount: z.number().positive(),
  token: z.string().default("DOT"),
  split: z.enum(["FIXED", "EQUAL_SPLIT", "VARIABLE"]).default("FIXED"),
  winnings: z.record(z.string(), z.number()), // { "1": 500, "2": 300, "3": 200 }
  deadline: z.string().datetime(),
  resources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().regex(URL_REGEX),
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
  visibility: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  organizationId: z.string(),
});

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
      whereClause.amount = {};
      if (minAmount) {
        const minAmountNum = Number.parseFloat(minAmount);
        if (!isNaN(minAmountNum)) {
          whereClause.amount.gte = minAmountNum;
        }
      }
      if (maxAmount) {
        const maxAmountNum = Number.parseFloat(maxAmount);
        if (!isNaN(maxAmountNum)) {
          whereClause.amount.lte = maxAmountNum;
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
        orderBy = { amount: "desc" };
        break;
      case "amount_high":
        orderBy = { amount: "desc" };
        break;
      case "amount_low":
        orderBy = { amount: "asc" };
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

// POST /api/v1/bounties - Create bounty
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
    const validatedData = createBountySchema.parse(body);

    // Check if user is a member of the organization
    const membership = await database.member.findFirst({
      where: {
        userId: session.user.id,
        organizationId: validatedData.organizationId,
        role: {
          in: ["owner", "admin"], // Only owners and admins can create bounties
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to create bounties for this organization",
        },
        { status: 403 }
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
    while (await database.bounty.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the bounty
    const bounty = await database.bounty.create({
      data: {
        title: validatedData.title,
        slug,
        description: validatedData.description,
        skills: validatedData.skills,
        amount: validatedData.amount,
        token: validatedData.token,
        split: validatedData.split,
        winnings: validatedData.winnings,
        deadline: new Date(validatedData.deadline),
        resources: validatedData.resources || undefined,
        screening: validatedData.screening || undefined,
        visibility: validatedData.visibility,
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

    // add current user as curator
    await database.curator.create({
      data: {
        userId: session.user.id,
        bountyId: bounty.id,
        contact: session.user.email,
      },
    });

    return NextResponse.json({
      success: true,
      bounty,
    });
  } catch (error) {
    console.error("Bounty creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: z.treeifyError(error) },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create bounty" },
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
