import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { sendGrantFirstApplicationEmail } from "@packages/email";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for grant application creation
const createApplicationSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().optional(),
  description: z.string().min(1),
  timeline: z
    .array(
      z.object({
        milestone: z.string(),
        date: z.string(),
      })
    )
    .optional(),
  milestones: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        deliverables: z.array(z.string()).optional(),
      })
    )
    .optional(),
  budget: z.number().positive().optional(),
  responses: z.record(z.string(), z.any()).optional(), // For screening question responses
  rfpId: z.string().optional(), // If applying through an RFP
});

// GET /api/v1/grants/[id]/applications - Get grant applications
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const grantId = (await params).id;

    // Check if grant exists and is published
    const grant = await database.grant.findFirst({
      where: {
        OR: [
          { id: grantId },
          { slug: { equals: grantId, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        slug: true,
        visibility: true,
        source: true,
      },
    });

    if (!grant) {
      return NextResponse.json(
        { error: "Grant not found" },
        {
          status: 404,
        }
      );
    }

    // Only show applications for published grants
    if (grant.visibility !== "PUBLISHED") {
      return NextResponse.json({ applications: [] });
    }

    // Fetch applications (only submitted ones for public view)
    const applications = await database.grantApplication.findMany({
      where: {
        grantId,
        status: {
          not: "DRAFT",
        },
      },
      include: {
        applicant: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
        rfp: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      {
        status: 500,
      }
    );
  }
}

// POST /api/v1/grants/[id]/applications - Create a grant application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to apply" },
        { status: 401 }
      );
    }

    const grantId = (await params).id;

    // Check if grant exists and is open
    const grant = await database.grant.findFirst({
      where: {
        OR: [
          { id: grantId },
          { slug: { equals: grantId, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        visibility: true,
        source: true,
        screening: true,
        organizationId: true,
        minAmount: true,
        maxAmount: true,
      },
    });

    if (!grant) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }

    if (grant.visibility !== "PUBLISHED" || grant.status !== "OPEN") {
      return NextResponse.json(
        { error: "This grant is not accepting applications" },
        { status: 400 }
      );
    }

    // Native grants only - External grants should use applicationUrl
    if (grant.source === "EXTERNAL") {
      return NextResponse.json(
        { error: "This grant uses external applications" },
        { status: 400 }
      );
    }

    // Check if user already has an application for this grant
    const existingApplication = await database.grantApplication.findFirst({
      where: {
        grantId: grant?.id,
        userId: session.user.id,
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied to this grant" },
        { status: 400 }
      );
    }

    // Check if user is a member of the org
    const membership = await database.member.findMany({
      where: {
        organizationId: grant.organizationId,
        userId: session.user.id,
      },
    });

    if (membership.length !== 0) {
      return NextResponse.json(
        {
          error:
            "Members of the same organization cannot apply to the same grant",
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createApplicationSchema.parse(body);

    // Validate budget is within grant range if specified
    if (validatedData.budget) {
      if (grant.minAmount && validatedData.budget < Number(grant.minAmount)) {
        return NextResponse.json(
          { error: `Budget must be at least ${grant.minAmount}` },
          { status: 400 }
        );
      }
      if (grant.maxAmount && validatedData.budget > Number(grant.maxAmount)) {
        return NextResponse.json(
          { error: `Budget cannot exceed ${grant.maxAmount}` },
          { status: 400 }
        );
      }
    }

    // If applying through an RFP, verify it exists and belongs to this grant
    if (validatedData.rfpId) {
      const rfp = await database.rFP.findUnique({
        where: {
          id: validatedData.rfpId,
          grantId: grant?.id,
        },
      });

      if (!rfp) {
        return NextResponse.json({ error: "Invalid RFP" }, { status: 400 });
      }
    }

    // Create the application
    const application = await database.grantApplication.create({
      data: {
        grantId: grant?.id,
        userId: session.user.id,
        rfpId: validatedData.rfpId,
        title: validatedData.title,
        summary: validatedData.summary,
        description: validatedData.description,
        timeline: validatedData.timeline || undefined,
        milestones: validatedData.milestones || undefined,
        budget: validatedData.budget || undefined,
        responses: validatedData.responses || undefined,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
      include: {
        applicant: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
      },
    });

    // Update grant application count
    await database.grant.update({
      where: { id: grant?.id },
      data: {
        applicationCount: {
          increment: 1,
        },
      },
    });

    // If applying through RFP, update RFP application count
    if (validatedData.rfpId) {
      await database.rFP.update({
        where: { id: validatedData.rfpId },
        data: {
          applicationCount: {
            increment: 1,
          },
        },
      });
    }

    // Check if this is the first application and send email notification
    const applicationCount = await database.grantApplication.count({
      where: { grantId: grant?.id },
    });

    if (applicationCount === 1) {
      // Get grant curators
      const grantCurators = await database.curator.findMany({
        where: { grantId: grant?.id },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              username: true,
            },
          },
        },
      });

      // Send first application email to only the grant curators
      for (const curator of grantCurators) {
        if (curator.user) {
          try {
            await sendGrantFirstApplicationEmail(
              {
                email: curator.user.email,
                firstName: curator.user.firstName || undefined,
                username: curator.user.username || undefined,
              },
              {
                id: grant.id,
                title: grant.title,
              },
              {
                id: application.id,
                title: application.title,
                summary:
                  application.summary ||
                  application.description.substring(0, 200),
                requestedAmount: application.budget
                  ? `$${application.budget.toLocaleString()}`
                  : "Not specified",
                applicant: {
                  firstName: application.applicant.firstName || undefined,
                  username: application.applicant.username || "Anonymous",
                },
              }
            );
          } catch (error) {
            console.error("Failed to send first application email:", error);
            // Don't fail the request if email fails
          }
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        application,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Application creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: z.treeifyError(error) },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create application" },
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
