import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { sendGrantStatusUpdateEmail } from "@packages/email";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env";

export async function OPTIONS() {
  return NextResponse.json({});
}

// PATCH /api/v1/grants/[id]/applications/[applicationId]/review - Review application
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewSchema = z.object({
      status: z.enum(["APPROVED", "REJECTED", "UNDER_REVIEW"]),
      feedback: z.string().optional(),
    });

    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    // Fetch application to check permissions
    const application = await database.grantApplication.findUnique({
      where: {
        id: (await params).applicationId,
        grantId: (await params).id,
      },
      include: {
        grant: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to review applications
    const userMember = await database.member.findFirst({
      where: {
        organizationId: application.grant.organizationId,
        userId: sessionData.user.id,
        role: {
          in: ["owner", "admin"],
        },
      },
    });

    // Check if user is the curator (future implementation)
    const isCurator = false; // TODO: Implement curator assignment

    if (!(userMember || isCurator)) {
      return NextResponse.json(
        { error: "You don't have permission to review applications" },
        { status: 403 }
      );
    }

    // Update application status
    const updatedApplication = await database.grantApplication.update({
      where: {
        id: (await params).applicationId,
      },
      data: {
        status: validatedData.status,
        notes: validatedData.feedback,
        reviewedAt: new Date(),
      },
      include: {
        grant: {
          select: {
            id: true,
            title: true,
            organizationId: true,
          },
        },
        applicant: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
          },
        },
      },
    });

    // Send email notification to applicant about the decision
    try {
      await sendGrantStatusUpdateEmail(
        {
          email: updatedApplication.applicant.email,
          username: updatedApplication.applicant.username || undefined,
          firstName: updatedApplication.applicant.firstName || undefined,
        },
        updatedApplication.title,
        validatedData.status,
        validatedData.feedback,
        `${env.NEXT_PUBLIC_WEB_URL}/grants/${updatedApplication.grantId}/applications/${updatedApplication.id}`
      );
    } catch (emailError) {
      console.error("Failed to send status update email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      application: updatedApplication,
      message: `Application ${validatedData.status.toLowerCase()} successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: z.treeifyError(error) },
        { status: 400 }
      );
    }

    console.error("Error reviewing application:", error);
    return NextResponse.json(
      { error: "Failed to review application" },
      { status: 500 }
    );
  }
}
