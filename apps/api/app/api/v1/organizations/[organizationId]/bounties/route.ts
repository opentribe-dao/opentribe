import { URL_REGEX } from "@packages/base/lib/utils";
import { database } from "@packages/db";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationAuth, hasRequiredRole } from "@/lib/organization-auth";

// Schema for bounty creation
const createBountySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  skills: z.array(z.string()).min(1),
  amount: z.number().positive(),
  token: z.string().default("DOT"),
  split: z.enum(["FIXED", "EQUAL_SPLIT", "VARIABLE"]).default("FIXED"),
  winnings: z.record(z.string(), z.number()),
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
        type: z.enum(["text", "url", "file", "boolean"]),
        optional: z.boolean(),
      })
    )
    .optional(),
  visibility: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

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
    const { organizationId } = await params;

    // Get auth (middleware already validated membership)
    const orgAuth = await getOrganizationAuth(request, organizationId);
    if (!orgAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

// POST /api/v1/organizations/[organizationId]/bounties - Create bounty
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;

    // Get auth (middleware already validated membership)
    const orgAuth = await getOrganizationAuth(request, organizationId);
    if (!orgAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin/owner role
    if (!hasRequiredRole(orgAuth.membership, ["owner", "admin"])) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to create bounties for this organization",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createBountySchema.parse(body);

    // Generate a unique slug from the title
    const baseSlug = validatedData.title
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
        organizationId,
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

    // Add current user as curator
    const { auth } = await import("@packages/auth/server");
    const { headers: getHeaders } = await import("next/headers");
    const session = await auth.api.getSession({
      headers: await getHeaders(),
    });

    await database.curator.create({
      data: {
        userId: orgAuth.userId,
        bountyId: bounty.id,
        contact: session?.user?.email || "",
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
