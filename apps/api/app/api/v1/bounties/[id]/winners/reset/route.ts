import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function OPTIONS() {
  return NextResponse.json({});
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bountyId = (await params).id;

    // Fetch bounty to check permissions
    const bounty = await database.bounty.findUnique({
      where: {
        id: bountyId,
      },
    });

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
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
        { status: 403 }
      );
    }

    // Find all submissions with positions assigned (winners) for this bounty
    const winnerSubmissions = await database.submission.findMany({
      where: {
        bountyId,
        position: { not: null },
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

    if (winnerSubmissions.length === 0) {
      return NextResponse.json({
        message: "No winner submissions found to reset",
        resetCount: 0,
      });
    }

    // Reset all submissions with positions (clear positions, keep status)
    const resetResult = await database.submission.updateMany({
      where: {
        bountyId,
        position: { not: null },
      },
      data: {
        position: null,
        winningAmount: null,
        isWinner: false,
        reviewedAt: new Date(),
        // Keep existing status - don't change it
      },
    });

    // TODO: Send email notifications to all affected submitters

    return NextResponse.json({
      message: `Successfully reset ${resetResult.count} winner submissions`,
      resetCount: resetResult.count,
      affectedSubmissions: winnerSubmissions.map((sub) => ({
        id: sub.id,
        title: sub.title,
        submitter: sub.submitter,
      })),
    });
  } catch (error) {
    console.error("Error resetting winner submissions:", error);
    return NextResponse.json(
      { error: "Failed to reset winner submissions" },
      { status: 500 }
    );
  }
}
