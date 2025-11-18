import { OPTIONAL_URL_REGEX, URL_REGEX } from "@packages/base/lib/utils";
import { database } from "@packages/db";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationAuth, hasRequiredRole } from "@/lib/organization-auth";

// Query params schema
const queryParamsSchema = z.object({
  limit: z.string().transform(Number).default(10),
  offset: z.string().transform(Number).default(0),
  status: z.enum(["OPEN", "PAUSED", "CLOSED", "ALL"]).default("ALL"),
  visibility: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "ALL"]).default("ALL"),
  source: z.enum(["NATIVE", "EXTERNAL", "ALL"]).default("ALL"),
  search: z.string().optional(),
});

// Schema for grant creation
const createGrantSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  summary: z.string().optional(),
  instructions: z.string().optional(),
  logoUrl: z.string().regex(OPTIONAL_URL_REGEX).optional(),
  bannerUrl: z.string().regex(OPTIONAL_URL_REGEX).optional(),
  skills: z.array(z.string()).default([]),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  totalFunds: z.number().positive().optional(),
  token: z.string().default("DOT"),
  resources: z
    .array(
      z.object({
        title: z.string(),
        url: z.string().regex(URL_REGEX),
        description: z.string().optional(),
      })
    )
    .optional(),
  resourceFiles: z.array(z.string().regex(URL_REGEX)).optional(),
  screening: z
    .array(
      z.object({
        question: z.string(),
        type: z.enum(["text", "url", "file"]),
        optional: z.boolean(),
      })
    )
    .optional(),
  applicationUrl: z.string().regex(OPTIONAL_URL_REGEX).optional(),
  visibility: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  source: z.enum(["NATIVE", "EXTERNAL"]).default("NATIVE"),
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
    const source = searchParams.get("source") || "ALL";
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
                image: true,
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

    return NextResponse.json({
      grants: grantsWithStats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching organization grants:", error);
    return NextResponse.json(
      { error: "Failed to fetch grants" },
      {
        status: 500,
      }
    );
  }
}

// POST /api/v1/organizations/[organizationId]/grants - Create grant
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
            "You do not have permission to create grants for this organization",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createGrantSchema.parse(body);

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
    const baseSlug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = baseSlug;
    let counter = 1;

    while (
      (await database.grant.findUnique({ where: { slug } })) &&
      counter < 1000
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    if (counter >= 1000) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    // Set source based on applicationUrl
    const source =
      validatedData.applicationUrl?.length &&
      validatedData.applicationUrl.length > 0
        ? "EXTERNAL"
        : "NATIVE";

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
        resources: validatedData.resourceFiles?.length
          ? [
              ...(validatedData.resources ?? []),
              ...validatedData.resourceFiles.map((file) => ({
                title: "Attachment",
                url: file,
                description: undefined,
              })),
            ]
          : validatedData.resources || undefined,
        screening: validatedData.screening || undefined,
        applicationUrl: validatedData.applicationUrl,
        visibility: validatedData.visibility,
        source,
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
        grantId: grant.id,
        contact: session?.user?.email || "",
      },
    });

    return NextResponse.json({
      success: true,
      grant,
    });
  } catch (error) {
    console.error("Grant creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: z.treeifyError(error) },
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
  });
}
