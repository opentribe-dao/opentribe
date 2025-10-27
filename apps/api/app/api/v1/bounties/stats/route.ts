import { database } from "@packages/db";
import { redis } from "@packages/security/cache";
import { type NextRequest, NextResponse } from "next/server";

interface BountyStatsResponse {
  total_bounties_count: number;
  total_rewards: number;
}

const CACHE_KEY = "bounties:stats";
const CACHE_TTL_SECONDS = 600; // 10 minutes

// GET /api/v1/bounties/stats - Get bounty statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    // Try to get from cache first
    if (!refresh) {
      const cached = await redis.get<BountyStatsResponse | string>(CACHE_KEY);
      if (cached) {
        const data: BountyStatsResponse =
          typeof cached === "string"
            ? (JSON.parse(cached) as BountyStatsResponse)
            : (cached as BountyStatsResponse);
        return withHeaders(NextResponse.json(data));
      }
    }

    // Fetch fresh data
    const stats = await getBountyStats();

    // Store in cache
    await redis.set(CACHE_KEY, JSON.stringify(stats), {
      ex: CACHE_TTL_SECONDS,
    });

    return withHeaders(NextResponse.json(stats));
  } catch (error) {
    console.error("Error fetching bounty stats:", error);
    return withHeaders(
      NextResponse.json(
        {
          error: "Failed to fetch bounty statistics",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        {
          status: 500,
        }
      )
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

async function getBountyStats(): Promise<BountyStatsResponse> {
  // Get total published bounties count (any status)
  const totalBountiesCount = await database.bounty.count({
    where: {
      visibility: "PUBLISHED",
    },
  });

  // Get total rewards from Completed Bounties
  const totalRewards = await database.bounty.aggregate({
    where: {
      visibility: "PUBLISHED",
      status: {
        in: ["COMPLETED", "OPEN", "REVIEWING"],
      },
    },
    _sum: {
      amountUSD: true,
    },
  });

  return {
    total_bounties_count: totalBountiesCount,
    total_rewards: Number(totalRewards._sum.amountUSD || 0),
  };
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
  });
}
