import { type NextRequest, NextResponse } from "next/server";
import { database } from "@packages/db";
import { redis } from "@packages/security/cache";

interface TopGrant {
  id: string;
  title: string;
  applicationCount: number;
  viewCount: number;
  token: string;
  organization: {
    name: string;
    logo: string;
  };
}

const CACHE_KEY = "top:grants";
const CACHE_TTL_SECONDS = 1800; // 30 minutes
const TOP_GRANT_COUNT = 6;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    if (!refresh) {
      const cached = await redis.get<TopGrant[] | string>(CACHE_KEY);
      if (cached) {
        const data: TopGrant[] =
          typeof cached === "string"
            ? (JSON.parse(cached) as TopGrant[])
            : (cached as TopGrant[]);
        return withHeaders(NextResponse.json({ data }));
      }
    }

    const topGrants = await getTopGrants();
    await redis.set(CACHE_KEY, JSON.stringify(topGrants), {
      ex: CACHE_TTL_SECONDS,
    });

    return withHeaders(NextResponse.json({ data: topGrants }));
  } catch {
    return withHeaders(
      NextResponse.json(
        { error: "Failed to fetch top grants" },
        { status: 500 }
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

async function getTopGrants(): Promise<TopGrant[]> {
  // Query top grantCount grants in desc order of applicationCount, viewCount
  const grants = await database.grant.findMany({
    where: {
      status: "OPEN",
      visibility: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
      applicationCount: true,
      viewCount: true,
      token: true,
      organization: {
        select: {
          name: true,
          logo: true,
        },
      },
    },
    orderBy: [{ applicationCount: "desc" }, { viewCount: "desc" }],
    take: TOP_GRANT_COUNT,
  });

  return grants.map((grant) => ({
    id: grant.id,
    title: grant.title,
    applicationCount: grant.applicationCount,
    viewCount: grant.viewCount,
    token: grant.token ?? "DOT",
    organization: {
      name: grant.organization.name,
      logo: grant.organization.logo ?? "",
    },
  }));
}

export function OPTIONS() {
  return withHeaders(new NextResponse(null, { status: 200 }));
}
