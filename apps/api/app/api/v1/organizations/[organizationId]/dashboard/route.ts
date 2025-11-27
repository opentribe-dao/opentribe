import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { getOrganizationAuth } from "@/lib/organization-auth";

// Typed response per DASHBOARD_API.md
interface DashboardResponse {
  stats: {
    activeBounties: number;
    activeGrants: number;
    pendingSubmissions: number;
    pendingApplications: number;
    totalAwarded: number;
    totalMembers: number;
  };
  urgentActions: Array<{
    id: string;
    type:
      | "REVIEW_SUBMISSIONS"
      | "REVIEW_APPLICATIONS"
      | "DEADLINE_APPROACHING"
      | "WINNER_ANNOUNCEMENT";
    title: string;
    description: string;
    count?: number;
    deadline?: Date;
    resourceId: string;
    resourceType: "bounty" | "grant";
    actionUrl: string;
    priority: "high" | "medium" | "low";
  }>;
  recentActivity: Array<{
    id: string;
    type: "NEW_SUBMISSION" | "NEW_APPLICATION" | "COMMENT" | "MEMBER_JOINED";
    actorName: string;
    actorAvatar?: string;
    action: string;
    resourceTitle: string;
    resourceUrl: string;
    timestamp: Date;
    isNew: boolean;
  }>;
}

export async function OPTIONS() {
  return NextResponse.json({});
}

// GET /api/v1/organizations/[organizationId]/dashboard - Get dashboard overview
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    // Auth check
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({ headers: authHeaders });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await params;

    // Organization membership check
    const orgAuth = await getOrganizationAuth(request, organizationId, {
      session: sessionData,
    });

    if (!orgAuth) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Compute stats in parallel
    const [
      activeBountiesCount,
      activeGrantsCount,
      pendingSubmissionsCount,
      pendingApplicationsCount,
      totalAwardedAggregate,
      totalMembersCount,
    ] = await Promise.all([
      database.bounty.count({
        where: {
          organizationId,
          status: "OPEN" as any,
          visibility: "PUBLISHED" as any,
        },
      }),
      database.grant.count({
        where: {
          organizationId,
          status: "OPEN" as any,
          visibility: "PUBLISHED" as any,
        },
      }),
      database.submission.count({
        where: {
          status: "SUBMITTED" as any,
          bounty: { organizationId },
        },
      }),
      database.grantApplication.count({
        where: {
          status: "SUBMITTED" as any,
          grant: { organizationId },
        },
      }),
      database.submission.aggregate({
        where: {
          isWinner: true,
          bounty: { organizationId },
        },
        _sum: { winningAmountUSD: true },
      }),
      database.member.count({
        where: { organizationId },
      }),
    ]);

    const totalAwarded = Number(totalAwardedAggregate._sum.winningAmountUSD || 0);

    // Urgent actions data
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      recentPendingSubmissions,
      recentPendingApplications,
      upcomingDeadlineBounties,
      bountiesNeedingAnnouncement,
    ] = await Promise.all([
      // Submissions awaiting review
      database.submission.findMany({
        where: {
          status: "SUBMITTED" as any,
          bounty: { organizationId },
        },
        select: {
          id: true,
          bountyId: true,
          submittedAt: true,
          submitter: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
              image: true,
            },
          },
          bounty: { select: { id: true, title: true } },
        },
        orderBy: {
          submittedAt: "asc",
        },
        take: 10,
      }),
      // Applications awaiting review
      database.grantApplication.findMany({
        where: {
          status: "SUBMITTED" as any,
          grant: { organizationId },
        },
        select: {
          id: true,
          grantId: true,
          submittedAt: true,
          applicant: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
              image: true,
            },
          },
          grant: { select: { id: true, title: true } },
        },
        orderBy: {
          submittedAt: "asc",
        },
        take: 10,
      }),
      // Bounties with deadlines in next 7 days
      database.bounty.findMany({
        where: {
          organizationId,
          status: "OPEN" as any,
          visibility: "PUBLISHED" as any,
          deadline: { gte: now, lte: sevenDaysFromNow },
        },
        select: {
          id: true,
          title: true,
          deadline: true,
        },
        orderBy: { deadline: "asc" },
        take: 10,
      }),
      // Bounties needing winner announcement (deadline passed, winners not announced, has submissions)
      database.bounty.findMany({
        where: {
          organizationId,
          visibility: "PUBLISHED" as any,
          winnersAnnouncedAt: null,
          deadline: { lt: now },
          // status can be OPEN or REVIEWING before announcing
          status: { in: ["OPEN", "REVIEWING"] as any },
        },
        select: {
          id: true,
          title: true,
          _count: { select: { submissions: true } },
        },
        orderBy: { deadline: "asc" },
        take: 10,
      }),
    ]);

    // Aggregate pending submissions per bounty
    const pendingByBounty = new Map<string, { title: string; count: number }>();
    for (const s of recentPendingSubmissions) {
      const key = s.bountyId;
      const current = pendingByBounty.get(key) || {
        title: s.bounty.title,
        count: 0,
      };
      current.count += 1;
      pendingByBounty.set(key, current);
    }

    // Aggregate pending applications per grant
    const pendingByGrant = new Map<string, { title: string; count: number }>();
    for (const a of recentPendingApplications) {
      const key = a.grantId;
      const current = pendingByGrant.get(key) || {
        title: a.grant.title,
        count: 0,
      };
      current.count += 1;
      pendingByGrant.set(key, current);
    }

    // Build urgent actions
    const urgentActions: DashboardResponse["urgentActions"] = [];

    // Review submissions actions
    for (const [bountyId, info] of pendingByBounty) {
      urgentActions.push({
        id: `review-submissions-${bountyId}`,
        type: "REVIEW_SUBMISSIONS",
        title: `Review ${info.count} new submission${info.count > 1 ? "s" : ""}`,
        description: `New submission${info.count > 1 ? "s" : ""} awaiting review for ${info.title}`,
        count: info.count,
        resourceId: bountyId,
        resourceType: "bounty",
        actionUrl: `/bounties/${bountyId}/submissions`,
        priority: "medium",
      });
    }

    // Review applications actions
    for (const [grantId, info] of pendingByGrant) {
      urgentActions.push({
        id: `review-applications-${grantId}`,
        type: "REVIEW_APPLICATIONS",
        title: `Review ${info.count} new application${info.count > 1 ? "s" : ""}`,
        description: `New application${info.count > 1 ? "s" : ""} awaiting review for ${info.title}`,
        count: info.count,
        resourceId: grantId,
        resourceType: "grant",
        actionUrl: `/grants/${grantId}/applications`,
        priority: "medium",
      });
    }

    // Deadline approaching actions
    for (const b of upcomingDeadlineBounties) {
      const timeToDeadline = b.deadline
        ? b.deadline.getTime() - now.getTime()
        : 0;
      const daysLeft = Math.ceil(timeToDeadline / (24 * 60 * 60 * 1000));
      urgentActions.push({
        id: `deadline-${b.id}`,
        type: "DEADLINE_APPROACHING",
        title: `Deadline approaching: ${b.title}`,
        description: `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left to deadline`,
        deadline: b.deadline || undefined,
        resourceId: b.id,
        resourceType: "bounty",
        actionUrl: `/bounties/${b.id}`,
        priority: daysLeft <= 3 ? "high" : "medium",
      });
    }

    // Winner announcement actions
    for (const b of bountiesNeedingAnnouncement) {
      if (b._count.submissions > 0) {
        urgentActions.push({
          id: `announce-winners-${b.id}`,
          type: "WINNER_ANNOUNCEMENT",
          title: `Announce winners: ${b.title}`,
          description:
            "Deadline passed. Announce winners to complete this bounty.",
          resourceId: b.id,
          resourceType: "bounty",
          actionUrl: `/bounties/${b.id}/submissions/`,
          priority: "high",
        });
      }
    }

    // Sort urgent actions: high priority first, then by closest deadline or higher counts
    const priorityOrder: Record<"high" | "medium" | "low", number> = {
      high: 0,
      medium: 1,
      low: 2,
    };
    urgentActions.sort((a, b) => {
      const p = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (p !== 0) return p;
      // If both have deadlines, sort by earliest
      if (a.deadline && b.deadline)
        return a.deadline.getTime() - b.deadline.getTime();
      // If counts exist, sort by higher count desc
      if (a.count && b.count) return b.count - a.count;
      return 0;
    });

    // Recent activity
    const [
      recentSubmissions,
      recentApplications,
      recentComments,
      recentMembers,
    ] = await Promise.all([
      database.submission.findMany({
        where: {
          bounty: { organizationId },
          status: "SUBMITTED" as any,
        },
        select: {
          id: true,
          title: true,
          submittedAt: true,
          createdAt: true,
          submitter: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
              image: true,
            },
          },
          bounty: { select: { id: true, title: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: 10,
      }),
      database.grantApplication.findMany({
        where: {
          grant: { organizationId },
          status: "SUBMITTED" as any,
        },
        select: {
          id: true,
          title: true,
          submittedAt: true,
          createdAt: true,
          applicant: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
              image: true,
            },
          },
          grant: { select: { id: true, title: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: 10,
      }),
      database.comment.findMany({
        where: {
          OR: [
            { bounty: { organizationId } },
            { application: { grant: { organizationId } } },
            { submission: { bounty: { organizationId } } },
            { rfp: { grant: { organizationId } } },
          ],
          isHidden: false,
        },
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
              image: true,
            },
          },
          bounty: { select: { id: true, title: true } },
          application: {
            select: {
              id: true,
              title: true,
              grantId: true,
              grant: { select: { id: true, title: true } },
            },
          },
          submission: {
            select: {
              id: true,
              title: true,
              bountyId: true,
              bounty: { select: { id: true, title: true } },
            },
          },
          rfp: {
            select: {
              id: true,
              title: true,
              grantId: true,
              grant: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      database.member.findMany({
        where: {
          organizationId,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          id: true,
          createdAt: true,
          user: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const submissionActivities = recentSubmissions.map((s) => {
      const actorName =
        s.submitter.firstName || s.submitter.username || "Someone";
      return {
        id: `sub-${s.id}`,
        type: "NEW_SUBMISSION" as const,
        actorName,
        actorAvatar: s.submitter.image || undefined,
        action: "submitted a new entry",
        resourceTitle: s.bounty.title,
        resourceUrl: `/bounties/${s.bounty.id}`,
        timestamp: s.submittedAt || s.createdAt,
        isNew: (s.submittedAt || s.createdAt) >= twentyFourHoursAgo,
      };
    });

    const applicationActivities = recentApplications.map((a) => {
      const actorName =
        a.applicant.firstName || a.applicant.username || "Someone";
      return {
        id: `app-${a.id}`,
        type: "NEW_APPLICATION" as const,
        actorName,
        actorAvatar: a.applicant.image || undefined,
        action: "applied to a grant",
        resourceTitle: a.grant.title,
        resourceUrl: `/grants/${a.grant.id}/applications/${a.id}`,
        timestamp: a.submittedAt || a.createdAt,
        isNew: (a.submittedAt || a.createdAt) >= twentyFourHoursAgo,
      };
    });

    const commentActivities = recentComments.map((c) => {
      const actorName = c.author.firstName || c.author.username || "Someone";
      const onBounty = !!c.bounty;
      const onApplication = !!c.application;
      const onSubmission = !!(c as any).submission; // ensure presence check even if optional in types
      const onRfp = !!(c as any).rfp;

      let resourceTitle = "";
      let resourceUrl = "";

      if (onBounty) {
        resourceTitle = c.bounty!.title;
        resourceUrl = `/bounties/${c.bounty!.id}`;
      } else if (onApplication) {
        resourceTitle = c.application!.title || c.application!.grant.title;
        resourceUrl = `/grants/${c.application!.grantId}/applications/${c.application!.id}`;
      } else if (onSubmission) {
        const submission = (c as any).submission as {
          id: string;
          title?: string | null;
          bounty: { id: string; title: string };
        };
        resourceTitle = submission.title || submission.bounty.title;
        // Link to the bounty for context, consistent with other submission links above
        resourceUrl = `/bounties/${submission.bounty.id}`;
      } else if (onRfp) {
        const rfp = (c as any).rfp as {
          id: string;
          title?: string | null;
          grantId: string;
          grant: { id: string; title: string };
        };
        resourceTitle = rfp.title || rfp.grant.title;
        // Dashboard has /rfps/[id] route; link directly to the RFP detail
        resourceUrl = `/rfps/${rfp.id}`;
      }

      return {
        id: `comment-${c.id}`,
        type: "COMMENT" as const,
        actorName,
        actorAvatar: c.author.image || undefined,
        action: "commented",
        resourceTitle,
        resourceUrl,
        timestamp: c.createdAt,
        isNew: c.createdAt >= twentyFourHoursAgo,
      };
    });

    const memberActivities = recentMembers.map((m) => {
      const actorName = m.user.firstName || m.user.username || "New member";
      return {
        id: `member-${m.id}`,
        type: "MEMBER_JOINED" as const,
        actorName,
        actorAvatar: m.user.image || undefined,
        action: "joined the organization",
        resourceTitle: "Organization",
        resourceUrl: `/org/${organizationId}/members`,
        timestamp: m.createdAt,
        isNew: m.createdAt >= twentyFourHoursAgo,
      };
    });

    const recentActivity: DashboardResponse["recentActivity"] = [
      ...submissionActivities,
      ...applicationActivities,
      ...commentActivities,
      ...memberActivities,
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    const responsePayload: DashboardResponse = {
      stats: {
        activeBounties: activeBountiesCount,
        activeGrants: activeGrantsCount,
        pendingSubmissions: pendingSubmissionsCount,
        pendingApplications: pendingApplicationsCount,
        totalAwarded,
        totalMembers: totalMembersCount,
      },
      urgentActions,
      recentActivity,
    };

    // Caching headers (5 minutes), allow bypass with ?refresh=true
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    return NextResponse.json(
      { data: responsePayload },
      {
        headers: {
          "Cache-Control": refresh ? "no-cache" : "public, max-age=300",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching organization dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
