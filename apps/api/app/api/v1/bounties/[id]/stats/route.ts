import { auth } from '@packages/auth/server';
import { database } from '@packages/db';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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
  return NextResponse.json({}, { headers: corsHeaders });
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const bountyIdOrSlug = (await params).id;

    // Find by ID first, then by slug (case-insensitive)
    const bounty = await database.bounty.findFirst({
      where: {
        OR: [
          { id: bountyIdOrSlug },
          { slug: { equals: bountyIdOrSlug, mode: 'insensitive' } as any },
        ],
      },
      select: {
        id: true,
        createdAt: true,
        publishedAt: true,
        winnersAnnouncedAt: true,
        viewCount: true,
        submissionCount: true,
        organizationId: true,
      },
    });

    if (!bounty) {
      return NextResponse.json(
        { error: 'Bounty not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Organization membership check
    const membership = await database.member.findMany({
      where: {
        userId: sessionData.user.id,
        organizationId: bounty.organizationId,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Overview counts (use submissionCount from bounty)
    const [
      pendingReview,
      selectedWinners,
      rejectedSubmissions,
      firstSubmission,
    ] = await Promise.all([
      database.submission.count({ where: { bountyId: bounty.id, status: 'SUBMITTED' as any } }),
      // Winners determined by isWinner=true
      database.submission.count({ where: { bountyId: bounty.id, isWinner: true } }),
      database.submission.count({ where: { bountyId: bounty.id, status: 'REJECTED' as any } }),
      database.submission.findFirst({
        where: { bountyId: bounty.id },
        select: { submittedAt: true },
        orderBy: { submittedAt: 'asc' },
      }),
    ]);

    // Engagement metrics: placeholders until we track more signals
    const engagement: BountyStats['engagement'] = {
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
        publishedAt: bounty.publishedAt ? bounty.publishedAt.toISOString() : null,
        firstSubmissionAt: firstSubmission?.submittedAt
          ? firstSubmission.submittedAt.toISOString()
          : null,
        winnersAnnouncedAt: bounty.winnersAnnouncedAt
          ? bounty.winnersAnnouncedAt.toISOString()
          : null,
      },
      engagement,
    };

    return NextResponse.json(
      { stats } as BountyStatsResponse,
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error fetching bounty stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bounty stats' },
      { status: 500, headers: corsHeaders }
    );
  }
}
