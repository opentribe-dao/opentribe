import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ViewManager } from "@/lib/views";

export async function OPTIONS() {
  return NextResponse.json({});
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const grant = await database.grant.findFirst({
      where: {
        OR: [
          { id: (await params).id },
          { slug: { equals: (await params).id, mode: "insensitive" } },
        ],
      },
    });

    if (!grant) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }

    // Fetch application with all related data
    const application = await database.grantApplication.findUnique({
      where: {
        id: (await params).applicationId,
        grantId: grant?.id,
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
            slug: true,
          },
        },
        applicant: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
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
        { status: 404 }
      );
    }

    // Check if user has permission to view this application
    const userMember = await database.member.findFirst({
      where: {
        organizationId: application.grant.organizationId,
        userId: sessionData.user.id,
      },
    });

    // Allow organization members or the application creator to view
    const isCreator = application.userId === sessionData.user.id;
    if (!(userMember || isCreator)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      answers: application.responses as Record<string, unknown>,
      files: [], // TODO: Implement file attachments
      grant: application.grant,
      applicant: {
        ...application.applicant,
        skills: Array.isArray(application.applicant.skills)
          ? application.applicant.skills
          : (application.applicant.skills as string[] | null) || [],
      },
    };

    // Record view using ViewManager (userId preferred, else ip)
    const ip = ViewManager.extractClientIp(request as any);
    const vm = sessionData?.user?.id
      ? new ViewManager({ userId: sessionData.user.id })
      : ip
        ? new ViewManager({ userIp: ip })
        : null;
    if (vm) {
      await vm.recordViewForEntity(`application:${application.id}`);
    }

    return NextResponse.json({ application: transformedApplication });
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}
