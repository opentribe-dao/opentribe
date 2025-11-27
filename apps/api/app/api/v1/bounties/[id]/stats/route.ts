import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { getOrganizationAuth } from "@/lib/organization-auth";

// Response schema
export interface BountyStats {
  overview: {
    totalSubmissions: number;
    pendingReview: number;
    selectedWinners: number;
    rejectedSubmissions: number;
  };
  timeline: {
    createdAt: string;
    publishedAt: string | null;
    firstSubmissionAt: string | null;
    winnersAnnouncedAt: string | null;
  };
  engagement: {
    viewCount: number;
    applicationRate: number;
    completionRate: number;
  };
}

export interface BountyStatsResponse {
  stats: BountyStats;
}

export async function OPTIONS() {
  return NextResponse.json({});
}

// GET /api/v1/bounties/[id]/stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({ headers: authHeaders });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bountyIdOrSlug = (await params).id;

    // Find by ID first, then by slug (case-insensitive)
    const bounty = await database.bounty.findFirst({
      where: {
        OR: [
          { id: bountyIdOrSlug },
          { slug: { equals: bountyIdOrSlug, mode: "insensitive" } as any },
        ],
      },
      select: {
        id: true,
        createdAt: true,
        publishedAt: true,
        winnersAnnouncedAt: true,
        deadline: true,
        viewCount: true,
        submissionCount: true,
        organizationId: true,
      },
    });

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    // Organization membership check
    const orgAuth = await getOrganizationAuth(request, bounty.organizationId, {
      session: sessionData,
    });
    if (!orgAuth) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Overview counts (use submissionCount from bounty)
    const now = new Date();
    const deadlinePassed = bounty.deadline ? bounty.deadline < now : false;
    const winnersNotAnnounced = bounty.winnersAnnouncedAt === null;

    const [
      pendingReview,
      selectedWinners,
      rejectedSubmissions,
      firstSubmission,
    ] = await Promise.all([
      // pendingReview: Only count submissions that:
      // - Are not winners (isWinner = false AND position = null)
      // - Have status SUBMITTED
      // - Bounty deadline has passed
      // - Winners have not been announced yet
      deadlinePassed && winnersNotAnnounced
        ? database.submission.count({
            where: {
              bountyId: bounty.id,
              status: "SUBMITTED" as any,
              isWinner: false,
              position: null,
            },
          })
        : Promise.resolve(0), // Return 0 if deadline hasn't passed or winners already announced
      database.submission.count({
        where: { 
          bountyId: bounty.id, 
          isWinner: true,
          position: { not: null },
          status: "SUBMITTED", 
        },
      }),
      database.submission.count({
        where: { bountyId: bounty.id, status: "SPAM" as any },
      }),
      database.submission.findFirst({
        where: { bountyId: bounty.id },
        select: { submittedAt: true },
        orderBy: { submittedAt: "asc" },
      }),
    ]);

    // Engagement metrics: placeholders until we track more signals
    const engagement: BountyStats["engagement"] = {
      viewCount: Number(bounty.viewCount || 0),
      applicationRate: 0,
      completionRate: 0,
    };

    const stats: BountyStats = {
      overview: {
        totalSubmissions: Number(bounty.submissionCount || 0),
        pendingReview,
        selectedWinners,
        rejectedSubmissions,
      },
      timeline: {
        createdAt: bounty.createdAt.toISOString(),
        publishedAt: bounty.publishedAt
          ? bounty.publishedAt.toISOString()
          : null,
        firstSubmissionAt: firstSubmission?.submittedAt
          ? firstSubmission.submittedAt.toISOString()
          : null,
        winnersAnnouncedAt: bounty.winnersAnnouncedAt
          ? bounty.winnersAnnouncedAt.toISOString()
          : null,
      },
      engagement,
    };

    return NextResponse.json({ stats } as BountyStatsResponse);
  } catch (error) {
    console.error("Error fetching bounty stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch bounty stats" },
      { status: 500 }
    );
  }
}
