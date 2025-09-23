import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// PATCH /api/v1/bounties/[id]/winners/reset - Reset all approved submissions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const bountyId = (await params).id;

    // Fetch bounty to check permissions
    const bounty = await database.bounty.findUnique({
      where: {
        id: bountyId,
      },
    });

    if (!bounty) {
      return NextResponse.json(
        { error: "Bounty not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if user has permission to manage submissions
    const userMember = await database.member.findFirst({
      where: {
        organizationId: bounty.organizationId,
        userId: sessionData.user.id,
        role: {
          in: ["owner", "admin"],
        },
      },
    });

    if (!userMember) {
      return NextResponse.json(
        { error: "You don't have permission to manage submissions" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Find all approved submissions for this bounty
    const approvedSubmissions = await database.submission.findMany({
      where: {
        bountyId: bountyId,
        status: "APPROVED",
      },
      select: {
        id: true,
        title: true,
        position: true,
        winningAmount: true,
        reviewedAt: true,
        submitter: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (approvedSubmissions.length === 0) {
      return NextResponse.json(
        {
          message: "No approved submissions found to reset",
          resetCount: 0,
        },
        { headers: corsHeaders }
      );
    }

    // Reset all approved submissions to submitted status
    const resetResult = await database.submission.updateMany({
      where: {
        bountyId: bountyId,
        status: "APPROVED",
      },
      data: {
        status: "SUBMITTED",
        reviewedAt: new Date(),
        position: null,
        winningAmount: null,
        isWinner: false,
      },
    });

    // TODO: Send email notifications to all affected submitters

    return NextResponse.json(
      {
        message: `Successfully reset ${resetResult.count} approved submissions to submitted status`,
        resetCount: resetResult.count,
        affectedSubmissions: approvedSubmissions.map((sub) => ({
          id: sub.id,
          title: sub.title,
          submitter: sub.submitter,
        })),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error resetting approved submissions:", error);
    return NextResponse.json(
      { error: "Failed to reset approved submissions" },
      { status: 500, headers: corsHeaders }
    );
  }
}
