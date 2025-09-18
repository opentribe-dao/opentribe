import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST /api/v1/organizations/[organizationId]/invitations - Send invitation
export async function POST(
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if user has permission to invite members
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
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: corsHeaders }
      );
    }

    const inviteSchema = z.object({
      email: z.string().email(),
      role: z.enum(["member", "admin"]),
    });

    const body = await request.json();
    const { email, role } = inviteSchema.parse(body);

    // Check if user already exists
    const existingUser = await database.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Check if already a member
      const existingMember = await database.member.findFirst({
        where: {
          organizationId,
          userId: existingUser.id,
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member of this organization" },
          { status: 400, headers: corsHeaders }
        );
      }

      // Add user as member directly if they exist
      const newMember = await database.member.create({
        data: {
          organizationId,
          userId: existingUser.id,
          role,
        },
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

      // TODO: Send email notification to the user

      return NextResponse.json(
        {
          message: "User added to organization",
          member: newMember,
        },
        { headers: corsHeaders }
      );
    }

    // Create invitation for non-existing user
    const invitation = await database.invitation.create({
      data: {
        organizationId,
        email,
        role,
        inviterId: sessionData.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // TODO: Send invitation email

    return NextResponse.json(
      {
        message: "Invitation sent successfully",
        invitation,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500, headers: corsHeaders }
    );
  }
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
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
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: corsHeaders }
      );
    }

    const invitations = await database.invitation.findMany({
      where: {
        organizationId,
        status: "PENDING",
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

    return NextResponse.json({ invitations }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500, headers: corsHeaders }
    );
  }
}
