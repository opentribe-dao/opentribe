import { database } from "@packages/db";
import { redis } from "@packages/security/cache";
import { type NextRequest, NextResponse } from "next/server";

interface RfpStatsResponse {
  total_rfps_count: number;
  total_grants_count: number;
}

const CACHE_KEY = "rfps:stats";
const CACHE_TTL_SECONDS = 600; // 10 minutes

// GET /api/v1/rfps/stats - Get RFP statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    // Try to get from cache first
    if (!refresh) {
      const cached = await redis.get<RfpStatsResponse | string>(CACHE_KEY);
      if (cached) {
        const data: RfpStatsResponse =
          typeof cached === "string"
            ? (JSON.parse(cached) as RfpStatsResponse)
            : (cached as RfpStatsResponse);
        return withHeaders(NextResponse.json(data));
      }
    }

    // Fetch fresh data
    const stats = await getRfpStats();

    // Store in cache
    await redis.set(CACHE_KEY, JSON.stringify(stats), {
      ex: CACHE_TTL_SECONDS,
    });

    return withHeaders(NextResponse.json(stats));
  } catch (error) {
    console.error("Error fetching RFP stats:", error);
    return withHeaders(
      NextResponse.json(
        {
          error: "Failed to fetch RFP statistics",
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

async function getRfpStats(): Promise<RfpStatsResponse> {
  // Get total published RFPs count (any status)
  const totalRfpsCount = await database.rFP.count({
    where: {
      visibility: "PUBLISHED",
    },
  });

  // Get total published grants count (any status)
  const totalGrantsCount = await database.grant.count({
    where: {
      visibility: "PUBLISHED",
    },
  });

  return {
    total_rfps_count: totalRfpsCount,
    total_grants_count: totalGrantsCount,
  };
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
  });
}
