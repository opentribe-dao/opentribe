import { database } from "@packages/db";
import { getOrganizationAuth, hasRequiredRole } from "@/lib/organization-auth";
import { type NextRequest, NextResponse } from "next/server";

export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
  });
}

// DELETE /api/v1/organizations/[organizationId]/bounties/[id]/curators/[curatorId] - Remove curator
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      organizationId: string;
      id: string;
      curatorId: string;
    }>;
  }
) {
  try {
    const { organizationId, id: bountyId, curatorId } = await params;

    // Get auth
    const orgAuth = await getOrganizationAuth(request, organizationId);
    if (!orgAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only owner/admin can remove curators
    if (!hasRequiredRole(orgAuth.membership, ["owner", "admin"])) {
      return NextResponse.json(
        { error: "Only owners and admins can remove curators" },
        { status: 403 }
      );
    }

    // Verify bounty exists and belongs to org
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

    // Find curator
    const curator = await database.curator.findUnique({
      where: { id: curatorId },
    });

    if (!curator || curator.bountyId !== bounty.id) {
      return NextResponse.json({ error: "Curator not found" }, { status: 404 });
    }

    // Delete curator
    await database.curator.delete({
      where: { id: curatorId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing curator:", error);
    return NextResponse.json(
      { error: "Failed to remove curator" },
      { status: 500 }
    );
  }
}
