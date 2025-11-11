import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
// zod not needed here

export function OPTIONS() {
  return NextResponse.json({});
}

// GET /api/v1/organizations/[organizationId]/invitations - Get pending invitations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view invitations
    const userMember = await database.member.findFirst({
      where: {
        organizationId,
        userId: sessionData.user.id,
        role: {
          in: ["owner", "admin"],
        },
      },
    });

    if (!userMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitations = await database.invitation.findMany({
      where: {
        organizationId,
        status: "pending",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        expiresAt: "asc",
      },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/organizations/[organizationId]/invitations - Delete an invitation by id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Expect JSON body with invitationId
    const body = await request.json().catch(() => null);
    const invitationId: string | undefined = body?.invitationId;
    if (!invitationId) {
      return NextResponse.json(
        { error: "invitationId is required" },
        { status: 400 }
      );
    }

    // Check permission (owner/admin)
    const userMember = await database.member.findFirst({
      where: {
        organizationId,
        userId: sessionData.user.id,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!userMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ensure invitation belongs to this organization and is pending
    const invitation = await database.invitation.findFirst({
      where: { id: invitationId, organizationId, status: "pending" },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    await database.invitation.delete({ where: { id: invitationId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error deleting invitation:", error);
    return NextResponse.json(
      { error: "Failed to delete invitation" },
      { status: 500 }
    );
  }
}
