import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { sendBountyWinnerEmail } from "@packages/email";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for announcing winners
const announceWinnersSchema = z.object({
  winners: z
    .array(
      z.object({
        submissionId: z.string(),
        position: z.number().int().positive(),
        amount: z.number().positive(),
      })
    )
    .min(1),
});

// POST /api/v1/bounties/[id]/winners - Announce winners
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bountyId = (await params).id;

    // Get the bounty and check permissions
    const bounty = await database.bounty.findUnique({
      where: { id: bountyId },
      include: {
        organization: {
          include: {
            members: {
              where: {
                userId: session.user.id,
                role: {
                  in: ["owner", "admin"],
                },
              },
            },
          },
        },
      },
    });

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    if (bounty.organization.members.length === 0) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to announce winners for this bounty",
        },
        { status: 403 }
      );
    }

    // Check if bounty is in a valid state
    if (bounty.status !== "OPEN" && bounty.status !== "REVIEWING") {
      return NextResponse.json(
        {
          error:
            "Cannot announce winners for a bounty that is not open or under review",
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = announceWinnersSchema.parse(body);

    // Validate that total winner amounts match bounty winnings structure
    const totalWinnerAmount = validatedData.winners.reduce(
      (sum, winner) => sum + winner.amount,
      0
    );
    const totalBountyAmount = bounty.winnings
      ? Object.values(bounty.winnings as Record<string, number>).reduce(
          (sum, amount) => sum + amount,
          0
        )
      : Number(bounty.amount) || 0;

    if (Math.abs(totalWinnerAmount - totalBountyAmount) > 0.01) {
      return NextResponse.json(
        { error: "Total winner amounts must match the bounty prize pool" },
        { status: 400 }
      );
    }

    // Validate all submissions exist and belong to this bounty
    const submissionIds = validatedData.winners.map((w) => w.submissionId);
    const submissions = await database.submission.findMany({
      where: {
        id: { in: submissionIds },
        bountyId: bountyId,
        status: "APPROVED",
      },
    });

    if (submissions.length !== submissionIds.length) {
      return NextResponse.json(
        {
          error:
            "One or more submissions are invalid or not in submitted status",
        },
        { status: 400 }
      );
    }

    // Update all submissions in a transaction
    const result = await database.$transaction(async (tx) => {
      // First, reset any existing winners for this bounty
      await tx.submission.updateMany({
        where: {
          bountyId: bountyId,
          isWinner: true,
        },
        data: {
          isWinner: false,
          position: null,
          winningAmount: null,
          winnerUserId: null,
        },
      });

      // Then set the new winners
      const updatePromises = validatedData.winners.map((winner) => {
        const submission = submissions.find(
          (s) => s.id === winner.submissionId
        )!;
        return tx.submission.update({
          where: { id: winner.submissionId },
          data: {
            isWinner: true,
            position: winner.position,
            winningAmount: winner.amount,
            winnerUserId: submission.userId,
            status: "APPROVED",
            reviewedAt: new Date(),
          },
        });
      });

      await Promise.all(updatePromises);

      // Update bounty status
      const updatedBounty = await tx.bounty.update({
        where: { id: bountyId },
        data: {
          status: "COMPLETED",
          winnersAnnouncedAt: new Date(),
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          _count: {
            select: {
              submissions: true,
              comments: true,
            },
          },
          submissions: {
            where: {
              isWinner: true,
            },
            include: {
              submitter: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      return updatedBounty;
    });

    // Send winner notification emails
    try {
      const emailPromises = result.submissions.map(async (submission) => {
        const winner = submission.submitter;
        if (winner && winner.email) {
          return sendBountyWinnerEmail(
            {
              email: winner.email,
              firstName: winner.firstName || undefined,
              username: winner.username || undefined,
            },
            {
              id: result.id,
              title: result.title,
              organization: {
                name: result.organization.name,
              },
            },
            {
              id: submission.id,
              position: submission.position || 1,
              prizeAmount: String(submission.winningAmount || 0),
              token: result.token || "USDT",
            }
          );
        }
      });

      await Promise.allSettled(emailPromises);
    } catch (emailError) {
      console.error("Failed to send winner notification emails:", emailError);
      // Don't fail the request if emails fail
    }

    return NextResponse.json({
      success: true,
      bounty: result,
      message: "Winners announced successfully",
    });
  } catch (error) {
    console.error("Announce winners error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: z.treeifyError(error) },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to announce winners" },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
  });
}
