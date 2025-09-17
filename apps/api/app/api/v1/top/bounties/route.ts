import { NextRequest, NextResponse } from "next/server";
import { database } from "@packages/db";
import { redis } from "@packages/security/cache";

interface TopBounty {
  title: string;
  viewCount: number;
  token: string;
  organization: {
    name: string;
  };
}

const CACHE_KEY = "top:bounties";
const CACHE_TTL_SECONDS = 1800; // 30 minutes
const TOP_BOUNTY_COUNT = 6;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    if (!refresh) {
      const cached = await redis.get<TopBounty[] | string>(CACHE_KEY);
      if (cached) {
        const data: TopBounty[] =
          typeof cached === "string"
            ? (JSON.parse(cached) as TopBounty[])
            : (cached as TopBounty[]);
        return withHeaders(NextResponse.json({ data }));
      }
    }

    const topBounties = await getTopBounties();
    await redis.set(CACHE_KEY, JSON.stringify(topBounties), {
      ex: CACHE_TTL_SECONDS,
    });

    return withHeaders(NextResponse.json({ data: topBounties }));
  } catch (error) {
    console.error("Top bounties error:", error);
    return withHeaders(
      NextResponse.json({ error: "Failed to fetch top bounties" }, { status: 500 })
    );
  }
}

function withHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("Cache-Control", "s-maxage=1800, max-age=300");
  return response;
}

async function getTopBounties(): Promise<TopBounty[]> {
  // Step 1: Query total count of Bounties
  const totalBountyCount = await database.bounty.count({
    where: {
      status: "OPEN",
      visibility: "PUBLISHED",
    },
  });

  // Step 2: Calculate bountyCount = Min(TOP_BOUNTY_COUNT, totalBountyCount)
  const bountyCount = Math.min(TOP_BOUNTY_COUNT, totalBountyCount);

  // Step 3: Query top bountyCount bounties in desc order of viewCount
  const bounties = await database.bounty.findMany({
    where: {
      status: "OPEN",
      visibility: "PUBLISHED",
    },
    select: {
      title: true,
      viewCount: true,
      token: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      viewCount: "desc",
    },
    take: bountyCount,
  });

  return bounties.map((bounty) => ({
    title: bounty.title,
    viewCount: bounty.viewCount,
    token: bounty.token,
    organization: {
      name: bounty.organization.name,
    },
  }));
}

export async function OPTIONS() {
  return withHeaders(new NextResponse(null, { status: 200 }));
}
