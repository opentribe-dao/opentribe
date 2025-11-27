import { database } from "@packages/db";
import { getOrganizationAuth, hasRequiredRole } from "@/lib/organization-auth";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for adding a curator
const addCuratorSchema = z.object({
  userId: z.string().min(1),
});

export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
  });
}

// GET /api/v1/organizations/[organizationId]/bounties/[id]/curators - List curators for a bounty
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; id: string }> }
) {
  try {
    const { organizationId, id: bountyId } = await params;

    // Check if bounty exists
    const bounty = await database.bounty.findFirst({
      where: {
        OR: [{ id: bountyId }, { slug: bountyId }],
        organizationId,
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

// POST /api/v1/organizations/[organizationId]/bounties/[id]/curators - Add a curator to a bounty
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; id: string }> }
) {
  try {
    const { organizationId, id: bountyId } = await params;

    // Get auth (middleware checks general org access, but we need role check)
    const orgAuth = await getOrganizationAuth(request, organizationId);
    if (!orgAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only owner/admin can add curators
    if (!hasRequiredRole(orgAuth.membership, ["owner", "admin"])) {
      return NextResponse.json(
        { error: "Only owners and admins can add curators" },
        { status: 403 }
      );
    }

    // Parse body
    const body = await request.json();
    const { userId } = addCuratorSchema.parse(body);

    // Find bounty
    const bounty = await database.bounty.findFirst({
      where: {
        OR: [{ id: bountyId }, { slug: bountyId }],
        organizationId,
      },
      select: { id: true },
    });

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    // Verify the user to be added is a member of the organization
    const member = await database.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "User is not a member of this organization" },
        { status: 400 }
      );
    }

    // Check if already a curator
    const existingCurator = await database.curator.findFirst({
      where: {
        bountyId: bounty.id,
        userId,
      },
    });

    if (existingCurator) {
      return NextResponse.json(
        { error: "User is already a curator for this bounty" },
        { status: 400 }
      );
    }

    // Create curator
    const curator = await database.curator.create({
      data: {
        bountyId: bounty.id,
        userId,
        contact: member.user.email, // Default contact to email
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
    });

    return NextResponse.json({ curator });
  } catch (error) {
    console.error("Error adding curator:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to add curator" },
      { status: 500 }
    );
  }
}
