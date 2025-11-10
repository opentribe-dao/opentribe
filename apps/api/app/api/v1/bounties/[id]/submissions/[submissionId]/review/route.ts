import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function OPTIONS() {
  return NextResponse.json({});
}

// PATCH /api/v1/bounties/[id]/submissions/[submissionId]/review - Review submission
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const authHeaders = await headers();
    let winningAmount = null;
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewSchema = z.object({
      status: z.enum(["APPROVED", "REJECTED", "UNDER_REVIEW"]),
      feedback: z.string().optional(),
      position: z.number().optional(),
    });

    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    // Fetch submission to check permissions
    const submission = await database.submission.findUnique({
      where: {
        id: (await params).submissionId,
        bountyId: (await params).id,
      },
      include: {
        bounty: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to review submissions
    const userMember = await database.member.findFirst({
      where: {
        organizationId: submission.bounty.organizationId,
        userId: sessionData.user.id,
        role: {
          in: ["owner", "admin"],
        },
      },
    });

    if (!userMember) {
      return NextResponse.json(
        { error: "You don't have permission to review submissions" },
        { status: 403 }
      );
    }

    // If selecting as winner, validate position
    if (validatedData.status === "APPROVED") {
      if (!validatedData.position) {
        return NextResponse.json(
          { error: "Position is required when selecting a winner" },
          { status: 400 }
        );
      }

      // Check if position is valid
      // The bounty.winnings field is a JSON object like { "1": 8000, "2": 5000, "3": 2000 }
      // We need to check if the validatedData.position exists as a key in this object.
      const winningsObj = submission.bounty.winnings as Record<
        string,
        number
      > | null;
      const positionKey = String(validatedData.position);

      winningAmount =
        winningsObj && Object.hasOwn(winningsObj, positionKey)
          ? winningsObj[positionKey]
          : null;

      if (winningAmount === null || typeof winningAmount !== "number") {
        return NextResponse.json(
          { error: "Invalid winner position" },
          { status: 400 }
        );
      }

      // Check if position is already taken
      const existingWinner = await database.submission.findFirst({
        where: {
          bountyId: (await params).id,
          status: "APPROVED",
          position: validatedData.position,
          NOT: {
            id: (await params).submissionId,
          },
        },
      });

      if (existingWinner) {
        return NextResponse.json(
          { error: "This position is already taken by another submission" },
          { status: 400 }
        );
      }
    }

    // Update submission status
    const updatedSubmission = await database.submission.update({
      where: {
        id: (await params).submissionId,
      },
      data: {
        status: validatedData.status as any,
        notes: validatedData.feedback,
        reviewedAt: new Date(),
        position:
          validatedData.status === "APPROVED" ? validatedData.position : null,
        winningAmount,
      },
      include: {
        bounty: {
          select: {
            id: true,
            title: true,
            organizationId: true,
          },
        },
        submitter: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // TODO: Send email notification to submitter about the decision

    return NextResponse.json({
      submission: updatedSubmission,
      message: `Submission ${validatedData.status.toLowerCase()} successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: z.treeifyError(error) },
        { status: 400 }
      );
    }

    console.error("Error reviewing submission:", error);
    return NextResponse.json(
      { error: "Failed to review submission" },
      { status: 500 }
    );
  }
}
