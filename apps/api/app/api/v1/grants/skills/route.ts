import { NextRequest, NextResponse } from "next/server";
import { database } from "@packages/db";
import { redis } from "@packages/security/cache";

interface GrantSkillsResponse {
  skill: string;
  count: number;
}

const CACHE_KEY = "grants:skills";
const CACHE_TTL_SECONDS = 600;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh") === "true";

    if (!refresh) {
      const cached = await redis.get<GrantSkillsResponse[] | string>(CACHE_KEY);
      if (cached) {
        const data: GrantSkillsResponse[] =
          typeof cached === "string"
            ? (JSON.parse(cached) as GrantSkillsResponse[])
            : (cached as GrantSkillsResponse[]);
        return withHeaders(NextResponse.json({ data }));
      }
    }

    const skills = await getGrantSkills();
    await redis.set(CACHE_KEY, JSON.stringify(skills), {
      ex: CACHE_TTL_SECONDS,
    });

    return withHeaders(NextResponse.json({ data: skills }));
  } catch (error) {
    console.error("Grant skills error:", error);
    return withHeaders(
      NextResponse.json(
        { error: "Failed to fetch grant skills" },
        { status: 500 }
      )
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

async function getGrantSkills(): Promise<GrantSkillsResponse[]> {
  const grantSkills = await database.grant.findMany({
    select: { skills: true },
    where: { visibility: "PUBLISHED", status: "OPEN" },
  });

  const counter = new Map<string, number>();
  for (const row of grantSkills) {
    const list = Array.isArray(row.skills) ? row.skills : [];
    for (const s of list) {
      const skill = (s || "").toString().trim();
      if (!skill) continue;
      counter.set(skill, (counter.get(skill) || 0) + 1);
    }
  }

  return Array.from(counter.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([skill, count]) => ({ skill, count }));
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
