import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { formatZodError } from "@/lib/zod-errors";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function OPTIONS() {
  return NextResponse.json({});
}

/**
 * SPAM Review Endpoint
 * 
 * PATCH /api/v1/bounties/[id]/submissions/[submissionId]/review
 * 
 * This endpoint handles marking submissions as SPAM (replaces the old REJECTED status).
 * 
 * KEY DESIGN DECISION: Winners (submissions with assigned positions) cannot be marked as SPAM.
 * This prevents accidental marking of winners and ensures data integrity. To mark a winner
 * as SPAM, the position must be cleared first using the /position endpoint.
 * 
 * SPAM Status:
 * - Replaces the old REJECTED status
 * - Used for inappropriate or spam submissions
 * - SPAM submissions are hidden from public view (only visible to organization members)
 * - SPAM submissions are excluded from winner displays and announcements
 * 
 * Winner Protection:
 * - If submission has position !== null, return 400 error
 * - Admin must clear position first, then mark as SPAM
 * - This workflow prevents accidental marking of winners
 * 
 * @param request - Request body: { status: "SPAM" }
 * @param params - Route parameters: { id: bountyId, submissionId }
 * @returns Updated submission with status set to SPAM
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewSchema = z.object({
      status: z.literal("SPAM"), // Only SPAM status allowed
    });

    const body = await request.json();
    reviewSchema.parse(body); // Validate but don't need to store

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

    // WINNER PROTECTION: Check if submission has a position assigned (is a winner)
    // Winners cannot be marked as SPAM - must clear position first
    // This prevents accidental marking of winners and ensures data integrity
    // Workflow: Admin must first clear position using /position endpoint, then mark as SPAM
    if (submission.position !== null) {
      return NextResponse.json(
        {
          error:
            "Cannot mark winner as SPAM - submission has position assigned. Clear position first.",
        },
        { status: 400 }
      );
    }

    // Update submission status to SPAM
    const updatedSubmission = await database.submission.update({
      where: {
        id: (await params).submissionId,
      },
      data: {
        status: "SPAM",
        reviewedAt: new Date(),
        // Do NOT change position or winningAmount
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

    return NextResponse.json({
      submission: updatedSubmission,
      message: "Submission marked as SPAM successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error);
      return NextResponse.json(formattedError, { status: 400 });
    }

    console.error("Error marking submission as SPAM:", error);
    return NextResponse.json(
      { error: "Failed to mark submission as SPAM" },
      { status: 500 }
    );
  }
}
