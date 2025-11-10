import { database } from "@packages/db";
import { redis } from "@packages/security/cache";
import { type NextRequest, NextResponse } from "next/server";

interface TopRFP {
  id: string;
  slug: string;
  title: string;
  voteCount: number;
  grant: {
    organization: {
      name: string;
    };
  };
}

const CACHE_KEY = "top:rfps";
const CACHE_TTL_SECONDS = 1800; // 30 minutes
const TOP_RFP_COUNT = 6;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    if (!refresh) {
      const cached = await redis.get<TopRFP[] | string>(CACHE_KEY);
      if (cached) {
        const data: TopRFP[] =
          typeof cached === "string"
            ? (JSON.parse(cached) as TopRFP[])
            : (cached as TopRFP[]);
        return withHeaders(NextResponse.json({ data }));
      }
    }

    const topRfps = await getTopRfps();
    await redis.set(CACHE_KEY, JSON.stringify(topRfps), {
      ex: CACHE_TTL_SECONDS,
    });

    return withHeaders(NextResponse.json({ data: topRfps }));
  } catch (error) {
    console.error("Top RFPs error:", error);
    return withHeaders(
      NextResponse.json({ error: "Failed to fetch top RFPs" }, { status: 500 })
    );
  }
}

function withHeaders(response: NextResponse) {
  response.headers.set(
    "Cache-Control",
    `s-maxage=1800, max-age=${CACHE_TTL_SECONDS}`
  );
  return response;
}

async function getTopRfps(): Promise<TopRFP[]> {
  // Step 1: Query total count of RFPs
  const totalRfpCount = await database.rFP.count({
    where: {
      status: "OPEN",
      visibility: "PUBLISHED",
    },
  });

  // Step 2: If totalRfpCount < TOP_RFP_COUNT, return all RFPs
  if (totalRfpCount < TOP_RFP_COUNT) {
    return await getAllRfps();
  }

  // Step 3: Query for votes from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentVotes = await database.vote.findMany({
    where: {
      createdAt: {
        gt: thirtyDaysAgo,
      },
    },
    select: {
      rfpId: true,
      direction: true,
    },
  });

  // Group votes by rfpId and calculate net vote count
  const voteCounts = new Map<string, number>();
  for (const vote of recentVotes) {
    const currentCount = voteCounts.get(vote.rfpId) || 0;
    const voteValue = vote.direction === "UP" ? 1 : -1;
    voteCounts.set(vote.rfpId, currentCount + voteValue);
  }

  // Step 3b: Check if we have enough RFPs with recent votes
  const rfpIdsWithRecentVotes = Array.from(voteCounts.keys());
  const minRequiredRfps = Math.ceil(TOP_RFP_COUNT / 2);

  if (rfpIdsWithRecentVotes.length < minRequiredRfps) {
    // Not enough RFPs with recent votes, return all RFPs
    return await getAllRfps();
  }

  // Step 3c: Return top RFPs from recent votes, sorted by vote count
  const sortedRfpIds = rfpIdsWithRecentVotes
    .sort((a, b) => (voteCounts.get(b) || 0) - (voteCounts.get(a) || 0))
    .slice(0, TOP_RFP_COUNT);

  return await getRfpsByIds(sortedRfpIds);
}

async function getAllRfps(): Promise<TopRFP[]> {
  const rfps = await database.rFP.findMany({
    where: {
      status: "OPEN",
      visibility: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      voteCount: true,
      grant: {
        select: {
          organization: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      voteCount: "desc",
    },
    take: TOP_RFP_COUNT,
  });

  return rfps.map((rfp) => ({
    id: rfp.id,
    title: rfp.title,
    slug: rfp.slug,
    voteCount: rfp.voteCount,
    grant: {
      organization: {
        name: rfp.grant.organization.name,
      },
    },
  }));
}

async function getRfpsByIds(rfpIds: string[]): Promise<TopRFP[]> {
  const rfps = await database.rFP.findMany({
    where: {
      id: {
        in: rfpIds,
      },
      status: "OPEN",
      visibility: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      voteCount: true,
      grant: {
        select: {
          organization: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Sort by voteCount desc to maintain order
  return rfps
    .sort((a, b) => b.voteCount - a.voteCount)
    .map((rfp) => ({
      id: rfp.id,
      title: rfp.title,
      slug: rfp.slug,
      voteCount: rfp.voteCount,
      grant: {
        organization: {
          name: rfp.grant.organization.name,
        },
      },
    }));
}

export async function OPTIONS() {
  return withHeaders(new NextResponse(null, { status: 200 }));
}
