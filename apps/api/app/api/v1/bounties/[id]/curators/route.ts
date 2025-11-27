import { database } from "@packages/db";
import { type NextRequest, NextResponse } from "next/server";

export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
  });
}

// GET /api/v1/bounties/[id]/curators - List curators for a bounty
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bountyId } = await params;

    // Check if bounty exists and is published
    const bounty = await database.bounty.findFirst({
      where: {
        OR: [{ id: bountyId }, { slug: bountyId }],
        visibility: "PUBLISHED",
      },
      select: { id: true },
    });

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    // Fetch curators
    const curators = await database.curator.findMany({
      where: {
        bountyId: bounty.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ curators });
  } catch (error) {
    console.error("Error fetching curators:", error);
    return NextResponse.json(
      { error: "Failed to fetch curators" },
      { status: 500 }
    );
  }
}
