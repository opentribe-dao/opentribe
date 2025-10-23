import { NextRequest, NextResponse } from "next/server";
import { database } from "@packages/db";
import { redis } from "@packages/security/cache";

interface HomepageStatsResponse {
  platformStats: {
    totalOpportunities: number;
    totalBuilders: number;
    totalRewards: string;
    activeBounties: number;
    activeGrants: number;
  };
  featuredOrganizations: Array<{
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    totalOpportunities: number;
    totalValue: number;
  }>;
  popularSkills: Array<{
    skill: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: "submission" | "application";
    user: {
      firstName?: string | null;
      lastName?: string | null;
      username: string;
      image?: string | null;
    };
    target: {
      id: string;
      title: string;
      type: "bounty" | "grant";
      organizationName: string;
    };
    createdAt: string;
  }>;
}

const CACHE_KEY = "homepage:stats";
const CACHE_TTL_SECONDS = 300;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    if (!refresh) {
      const cached = await redis.get<HomepageStatsResponse | string>(CACHE_KEY);
      if (cached) {
        const data: HomepageStatsResponse =
          typeof cached === "string"
            ? (JSON.parse(cached) as HomepageStatsResponse)
            : (cached as HomepageStatsResponse);
        return withHeaders(NextResponse.json({ data }));
      }
    }

    const stats = await calculateHomepageStats();
    await redis.set(CACHE_KEY, JSON.stringify(stats), {
      ex: CACHE_TTL_SECONDS,
    });

    return withHeaders(NextResponse.json({ data: stats }));
  } catch (error) {
    console.error("Homepage stats error:", error);
    return withHeaders(
      NextResponse.json(
        { error: "Failed to fetch homepage statistics" },
        { status: 500 }
      )
    );
  }
}

function withHeaders(response: NextResponse) {
  response.headers.set(
    "Cache-Control",
    `s-maxage=3600, max-age=${CACHE_TTL_SECONDS}`
  );
  return response;
}

async function calculateHomepageStats(): Promise<HomepageStatsResponse> {
  const [platformStats, featuredOrganizations, popularSkills, recentActivity] =
    await Promise.all([
      calculatePlatformStats(),
      getFeaturedOrganizations(),
      getPopularSkills(),
      getRecentActivity(),
    ]);

  return {
    platformStats,
    featuredOrganizations,
    popularSkills,
    recentActivity,
  };
}

async function calculatePlatformStats(): Promise<
  HomepageStatsResponse["platformStats"]
> {
  const [activeBounties, activeGrants] = await Promise.all([
    database.bounty.count({
      where: {
        visibility: "PUBLISHED",
        status: { in: ["OPEN", "COMPLETED", "REVIEWING"] },
      },
    }),
    database.grant.count({
      where: { visibility: "PUBLISHED", status: "OPEN" },
    }),
  ]);

  const totalOpportunities = activeBounties + activeGrants;

  const [submissionUsers, applicationUsers] = await Promise.all([
    database.submission.findMany({
      select: { userId: true },
      where: { status: { not: "DRAFT" } },
      distinct: ["userId"],
    }),
    database.grantApplication.findMany({
      select: { userId: true },
      where: { status: { not: "DRAFT" } },
      distinct: ["userId"],
    }),
  ]);
  const uniqueBuilderIds = new Set<string>([
    ...submissionUsers.map((u) => u.userId),
    ...applicationUsers.map((u) => u.userId),
  ]);

  const [bountyAgg, grantsAgg] = await Promise.all([
    database.bounty.aggregate({
      _sum: { amountUSD: true },
      where: {
        winnersAnnouncedAt: { not: null },
        visibility: "PUBLISHED",
        status: { in: ["OPEN", "COMPLETED", "REVIEWING"] },
      },
    }),
    database.grant.aggregate({
      _sum: { totalFundsUSD: true },
      where: { visibility: "PUBLISHED", status: "OPEN" },
    }),
  ]);

  const bountyTotal = Number(bountyAgg?._sum?.amountUSD ?? 0);
  const grantTotal = Number(grantsAgg?._sum?.totalFundsUSD ?? 0);
  const totalRewards = formatCurrency(bountyTotal + grantTotal);

  return {
    totalOpportunities,
    totalBuilders: uniqueBuilderIds.size,
    totalRewards,
    activeBounties,
    activeGrants,
  };
}

async function getFeaturedOrganizations(): Promise<
  HomepageStatsResponse["featuredOrganizations"]
> {
  // Aggregate bounty counts and amounts by organization
  const [bountyAggByOrg, grantAggByOrg, orgs] = await Promise.all([
    database.bounty.groupBy({
      by: ["organizationId"],
      _where: undefined as unknown as never,
      where: {
        visibility: "PUBLISHED",
        status: { in: ["OPEN", "COMPLETED", "REVIEWING"] },
      },
      _sum: { amountUSD: true },
      _count: { _all: true },
    } as any),
    database.grant.findMany({
      where: { visibility: "PUBLISHED", status: "OPEN" },
      select: {
        organizationId: true,
        totalFundsUSD: true,
        id: true,
      },
    }),
    database.organization.findMany({
      select: { id: true, name: true, slug: true, logo: true },
    }),
  ]);

  const bountyByOrg = new Map<string, { count: number; value: number }>();
  for (const b of bountyAggByOrg) {
    const anyB = b as any;
    bountyByOrg.set(anyB.organizationId as string, {
      count: Number(anyB._count?._all ?? 0),
      value: Number(anyB._sum?.amount ?? 0),
    });
  }

  const grantsByOrg = new Map<string, { count: number; value: number }>();
  for (const g of grantAggByOrg) {
    const current = grantsByOrg.get(g.organizationId) || { count: 0, value: 0 };
    current.count += 1;
    current.value += Number(g.totalFundsUSD ?? 0);
    grantsByOrg.set(g.organizationId, current);
  }

  const merged = orgs.map((org) => {
    const b = bountyByOrg.get(org.id) || { count: 0, value: 0 };
    const g = grantsByOrg.get(org.id) || { count: 0, value: 0 };
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo ?? null,
      totalOpportunities: b.count + g.count,
      totalValue: b.value + g.value,
    };
  });

  return merged
    .filter((m) => m.totalOpportunities > 0)
    .sort((a, b) =>
      b.totalValue === a.totalValue
        ? b.totalOpportunities - a.totalOpportunities
        : b.totalValue - a.totalValue
    )
    .slice(0, 3);
}

async function getPopularSkills(): Promise<
  HomepageStatsResponse["popularSkills"]
> {
  const [bountySkills, grantSkills] = await Promise.all([
    database.bounty.findMany({
      select: { skills: true },
      where: { visibility: "PUBLISHED", status: { in: ["OPEN", "COMPLETED"] } },
    }),
    database.grant.findMany({
      select: { skills: true },
      where: { visibility: "PUBLISHED", status: "OPEN" },
    }),
  ]);

  const counter = new Map<string, number>();
  for (const row of [...bountySkills, ...grantSkills]) {
    const list = Array.isArray(row.skills) ? row.skills : [];
    for (const s of list) {
      const skill = (s || "").toString().trim();
      if (!skill) continue;
      counter.set(skill, (counter.get(skill) || 0) + 1);
    }
  }

  return Array.from(counter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));
}

async function getRecentActivity(): Promise<
  HomepageStatsResponse["recentActivity"]
> {
  const [recentSubmissions, recentApplications] = await Promise.all([
    database.submission.findMany({
      where: { status: { not: "DRAFT" } },
      include: {
        submitter: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            image: true,
          },
        },
        bounty: {
          select: {
            id: true,
            title: true,
            organization: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    database.grantApplication.findMany({
      where: { status: { not: "DRAFT" } },
      include: {
        applicant: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            image: true,
          },
        },
        grant: {
          select: {
            id: true,
            title: true,
            organization: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const submissionActivities = recentSubmissions.map((s) => ({
    id: s.id,
    type: "submission" as const,
    user: {
      firstName: s.submitter?.firstName ?? null,
      lastName: s.submitter?.lastName ?? null,
      username: s.submitter?.username ?? "",
      image: s.submitter?.image ?? null,
    },
    target: {
      id: s.bounty?.id ?? "",
      title: s.bounty?.title ?? "",
      type: "bounty" as const,
      organizationName: s.bounty?.organization?.name ?? "",
    },
    createdAt: s.createdAt.toISOString(),
  }));

  const applicationActivities = recentApplications.map((a) => ({
    id: a.id,
    type: "application" as const,
    user: {
      firstName: a.applicant?.firstName ?? null,
      lastName: a.applicant?.lastName ?? null,
      username: a.applicant?.username ?? "",
      image: a.applicant?.image ?? null,
    },
    target: {
      id: a.grant?.id ?? "",
      title: a.grant?.title ?? "",
      type: "grant" as const,
      organizationName: a.grant?.organization?.name ?? "",
    },
    createdAt: a.createdAt.toISOString(),
  }));

  return [...submissionActivities, ...applicationActivities]
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    .slice(0, 10);
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  } else if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  } else {
    return `$${amount.toLocaleString()}`;
  }
}
