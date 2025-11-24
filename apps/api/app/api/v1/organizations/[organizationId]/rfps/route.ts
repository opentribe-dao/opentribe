import { URL_REGEX } from "@packages/base/lib/utils";
import { database } from "@packages/db";
import { formatZodError } from "@/lib/zod-errors";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationAuth, hasRequiredRole } from "@/lib/organization-auth";

export async function OPTIONS() {
  return NextResponse.json({});
}

// GET /api/v1/organizations/[organizationId]/rfps - List organization's RFPs
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

    // Get RFPs for this organization's grants
    const rfps = await database.rFP.findMany({
      where: {
        grant: {
          organizationId,
        },
      },
      include: {
        grant: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        _count: {
          select: {
            comments: true,
            votes: {
              where: {
                direction: "UP",
              },
            },
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to include counts
    const transformedRfps = rfps.map((rfp) => ({
      id: rfp.id,
      title: rfp.title,
      slug: rfp.slug,
      status: rfp.status,
      visibility: rfp.visibility,
      viewCount: rfp.viewCount,
      commentCount: rfp._count.comments,
      voteCount: rfp._count.votes,
      applicationCount: rfp._count.applications,
      createdAt: rfp.createdAt,
      publishedAt: rfp.publishedAt,
      grant: rfp.grant,
    }));

    return NextResponse.json({ rfps: transformedRfps });
  } catch (error) {
    console.error("Error fetching organization RFPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch RFPs" },
      { status: 500 }
    );
  }
}

// POST /api/v1/organizations/[organizationId]/rfps - Create RFP
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const createRfpSchema = z.object({
      grantId: z.string(),
      title: z.string().min(1).max(200),
      description: z.string().min(1),
      resources: z
        .array(
          z.object({
            title: z.string(),
            url: z.string().regex(URL_REGEX),
            description: z.string().optional(),
          })
        )
        .optional(),
      status: z.enum(["OPEN", "PAUSED", "CLOSED"]).optional(),
      visibility: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    });

    const body = await request.json();
    const validatedData = createRfpSchema.parse(body);

    // Verify the grant belongs to this organization
    const grant = await database.grant.findFirst({
      where: {
        id: validatedData.grantId,
        organizationId,
      },
    });

    if (!grant) {
      return NextResponse.json(
        { error: "Grant not found or doesn't belong to this organization" },
        { status: 404 }
      );
    }

    // Generate slug from title
    const baseSlug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists and append number if needed
    while (await database.rFP.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the RFP and increment grant's rfpCount in an atomic transaction
    const result = await database.$transaction(async (tx) => {
      // Create the RFP
      const rfp = await tx.rFP.create({
        data: {
          ...validatedData,
          slug,
          publishedAt:
            validatedData.visibility === "PUBLISHED" ? new Date() : null,
        },
        include: {
          grant: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      });

      // Increment the rfpCount for the associated grant
      await tx.grant.update({
        where: { id: validatedData.grantId },
        data: {
          rfpCount: {
            increment: 1,
          },
        },
      });

      return rfp;
    });

    return NextResponse.json({ rfp: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error);
      return NextResponse.json(formattedError, { status: 400 });
    }

    console.error("Error creating RFP:", error);
    return NextResponse.json(
      { error: "Failed to create RFP" },
      { status: 500 }
    );
  }
}
