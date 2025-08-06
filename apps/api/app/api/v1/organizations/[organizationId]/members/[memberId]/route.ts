import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// DELETE /api/v1/organizations/[organizationId]/members/[memberId] - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { organizationId: string; memberId: string } }
) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if user has permission to remove members
    const userMember = await database.member.findFirst({
      where: {
        organizationId: params.organizationId,
        userId: sessionData.user.id,
        role: {
          in: ["owner", "admin"],
        },
      },
    });

    if (!userMember) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Get the member to be removed
    const memberToRemove = await database.member.findUnique({
      where: { id: params.memberId },
    });

    if (!memberToRemove || memberToRemove.organizationId !== params.organizationId) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Prevent removing the owner
    if (memberToRemove.role === "owner") {
      return NextResponse.json(
        { error: "Cannot remove the organization owner" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Prevent users from removing themselves
    if (memberToRemove.userId === sessionData.user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself from the organization" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Only owners can remove admins
    if (memberToRemove.role === "admin" && userMember.role !== "owner") {
      return NextResponse.json(
        { error: "Only owners can remove admins" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Remove the member
    await database.member.delete({
      where: { id: params.memberId },
    });

    return NextResponse.json(
      { message: "Member removed successfully" },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PATCH /api/v1/organizations/[organizationId]/members/[memberId] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { organizationId: string; memberId: string } }
) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Only owners can update member roles
    const userMember = await database.member.findFirst({
      where: {
        organizationId: params.organizationId,
        userId: sessionData.user.id,
        role: "owner",
      },
    });

    if (!userMember) {
      return NextResponse.json(
        { error: "Only owners can update member roles" },
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!["member", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the member to be updated
    const memberToUpdate = await database.member.findUnique({
      where: { id: params.memberId },
    });

    if (!memberToUpdate || memberToUpdate.organizationId !== params.organizationId) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Cannot change owner role
    if (memberToUpdate.role === "owner") {
      return NextResponse.json(
        { error: "Cannot change owner role" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update member role
    const updatedMember = await database.member.update({
      where: { id: params.memberId },
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

    return NextResponse.json(
      { member: updatedMember },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500, headers: corsHeaders }
    );
  }
}