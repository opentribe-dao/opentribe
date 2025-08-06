import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/v1/grants/[id]/applications/[applicationId] - Get application details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Fetch application with all related data
    const application = await database.grantApplication.findUnique({
      where: {
        id: (await params).applicationId,
        grantId: (await params).id,
      },
      include: {
        grant: {
          select: {
            id: true,
            title: true,
            organizationId: true,
            token: true,
            minAmount: true,
            maxAmount: true,
          },
        },
        applicant: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            location: true,
            bio: true,
            skills: true,
            github: true,
            linkedin: true,
            twitter: true,
            website: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if user has permission to view this application
    const userMember = await database.member.findFirst({
      where: {
        organizationId: application.grant.organizationId,
        userId: sessionData.user.id,
      },
    });

    // Only organization members can view applications
    if (!userMember) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Transform the application data
    const transformedApplication = {
      id: application.id,
      title: application.title,
      content: application.description,
      budget: application.budget,
      timeline: application.timeline,
      status: application.status,
      submittedAt: application.submittedAt,
      reviewedAt: application.reviewedAt,
      feedback: application.notes,
      answers: application.responses as any,
      files: [], // TODO: Implement file attachments
      grant: application.grant,
      applicant: {
        ...application.applicant,
        skills: Array.isArray(application.applicant.skills) 
          ? application.applicant.skills 
          : (application.applicant.skills as string[] | null) || [],
      },
    };

    return NextResponse.json(
      { application: transformedApplication },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500, headers: corsHeaders }
    );
  }
}