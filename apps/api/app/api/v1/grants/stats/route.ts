import { database } from "@packages/db";
import { redis } from "@packages/security/cache";
import { type NextRequest, NextResponse } from "next/server";

interface GrantStatsResponse {
  total_grants_count: number;
  total_funds: number;
}

const CACHE_KEY = "grants:stats";
const CACHE_TTL_SECONDS = 1800; // 30 minutes

// GET /api/v1/grants/stats - Get grant statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    // Try to get from cache first
    if (!refresh) {
      const cached = await redis.get<GrantStatsResponse | string>(CACHE_KEY);
      if (cached) {
        const data: GrantStatsResponse =
          typeof cached === "string"
            ? (JSON.parse(cached) as GrantStatsResponse)
            : (cached as GrantStatsResponse);
        return withHeaders(NextResponse.json(data));
      }
    }

    // Fetch fresh data
    const stats = await getGrantStats();

    // Store in cache
    await redis.set(CACHE_KEY, JSON.stringify(stats), {
      ex: CACHE_TTL_SECONDS,
    });

    return withHeaders(NextResponse.json(stats));
  } catch (error) {
    console.error("Error fetching grant stats:", error);
    return withHeaders(
      NextResponse.json(
        {
          error: "Failed to fetch grant statistics",
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

async function getGrantStats(): Promise<GrantStatsResponse> {
  // Get total published grants count (any status)
  const totalGrantsCount = await database.grant.count({
    where: {
      visibility: "PUBLISHED",
      status: "OPEN",
    },
  });

  // Get total funds from published grants
  const grantsAggregate = await database.grant.aggregate({
    where: {
      visibility: "PUBLISHED",
      status: "OPEN",
    },
    _sum: {
      totalFundsUSD: true,
    },
  });

  const totalFunds = grantsAggregate._sum.totalFundsUSD || 0;

  return {
    total_grants_count: totalGrantsCount,
    total_funds: Number(totalFunds),
  };
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
  });
}
