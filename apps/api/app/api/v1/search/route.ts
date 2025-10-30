import { database } from "@packages/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    console.log("Search API received query:", query);

    if (!query) {
      console.log("Search API: Query is empty, returning empty results.");
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const bounties = await database.bounty.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
        visibility: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      take: 5, // Limit results for each type
    });
    console.log("Search API: Bounties found:", bounties.length);

    const grants = await database.grant.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { summary: { contains: query, mode: "insensitive" } },
        ],
        visibility: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      take: 5,
    });
    console.log("Search API: Grants found:", grants.length);

    const rfps = await database.rFP.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
        visibility: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      take: 5,
    });
    console.log("Search API: RFPs found:", rfps.length);

    const results = [
      ...bounties.map((b) => ({ ...b, type: "bounties" })),
      ...grants.map((g) => ({ ...g, type: "grants" })),
      ...rfps.map((r) => ({ ...r, type: "rfps" })),
    ];

    console.log("Search API: Total results:", results.length);
    console.log("Search API: Combined results:", results);

    return NextResponse.json({ results }, { status: 200 });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
