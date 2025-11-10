import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function OPTIONS() {
  return NextResponse.json({});
}

// DELETE /api/v1/organizations/[organizationId]/members/[memberId] - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; memberId: string }> }
) {
  try {
    const { organizationId, memberId } = await params;
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to remove members
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

    // Get the member to be removed
    const memberToRemove = await database.member.findUnique({
      where: { id: memberId },
    });

    if (!memberToRemove || memberToRemove.organizationId !== organizationId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Prevent removing the owner
    if (memberToRemove.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove the organization owner" },
        { status: 400 }
      );
    }

    // Prevent users from removing themselves
    if (memberToRemove.userId === sessionData.user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself from the organization" },
        { status: 400 }
      );
    }

    // Only owners can remove admins
    if (memberToRemove.role === "admin" && userMember.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can remove admins" },
        { status: 403 }
      );
    }

    // Remove the member
    await database.member.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/organizations/[organizationId]/members/[memberId] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; memberId: string }> }
) {
  try {
    const { organizationId, memberId } = await params;
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only owners can update member roles
    const userMember = await database.member.findFirst({
      where: {
        organizationId,
        userId: sessionData.user.id,
        role: "owner",
      },
    });

    if (!userMember) {
      return NextResponse.json(
        { error: "Only owners can update member roles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!["member", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Get the member to be updated
    const memberToUpdate = await database.member.findUnique({
      where: { id: memberId },
    });

    if (!memberToUpdate || memberToUpdate.organizationId !== organizationId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Cannot change owner role
    if (memberToUpdate.role === "owner") {
      return NextResponse.json(
        { error: "Cannot change owner role" },
        { status: 400 }
      );
    }

    // Update member role
    const updatedMember = await database.member.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}
