import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { formatZodError } from "@/lib/zod-errors";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationAuth, hasRequiredRole } from "@/lib/organization-auth";

export function OPTIONS() {
  return NextResponse.json({});
}

/**
 * SPAM Review Endpoint
 *
 * PATCH /api/v1/bounties/[id]/submissions/[submissionId]/review
 *
 * This endpoint handles marking submissions as SPAM and unmarking them (replaces the old REJECTED status).
 *
 * SPAM Status:
 * - Replaces the old REJECTED status
 * - Used for inappropriate or spam submissions
 * - SPAM submissions are hidden from public view (only visible to organization members)
 * - SPAM submissions are excluded from winner displays and announcements
 * - When marking as SPAM, position, winningAmount, winningAmountUSD are cleared and isWinner is set to false
 *
 * Unmarking SPAM:
 * - Only submissions currently marked as SPAM can be unmarked
 * - Unmarking restores status to SUBMITTED
 * - Only organization owners/admins can unmark SPAM submissions
 *
 * @param request - Request body: { status: "SPAM" } to mark as SPAM, or { status: "SUBMITTED", action: "CLEAR_SPAM" } to unmark (both fields required for unmarking)
 * @param params - Route parameters: { id: bountyId, submissionId }
 * @returns Updated submission with status updated
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
      status: z.enum(["SPAM", "SUBMITTED"]),
      action: z.enum(["CLEAR_SPAM"]).optional(),
    });

    const body = await request.json();
    const validatedBody = reviewSchema.parse(body);

    // Determine if we're marking as SPAM or clearing SPAM
    // Require explicit action field for unambiguous behavior
    const isClearingSpam = validatedBody.action === "CLEAR_SPAM";

    // Reject ambiguous requests: status "SUBMITTED" without action field
    if (validatedBody.status === "SUBMITTED" && !isClearingSpam) {
      return NextResponse.json(
        {
          error:
            "Invalid request: status 'SUBMITTED' requires action 'CLEAR_SPAM' to unmark SPAM",
        },
        { status: 400 }
      );
    }

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
    const orgAuth = await getOrganizationAuth(
      request,
      submission.bounty.organizationId,
      { session: sessionData }
    );
    if (!orgAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin/owner role
    const isOwnerOrAdmin = hasRequiredRole(orgAuth.membership, [
      "owner",
      "admin",
    ]);

    // Check if user is a curator for this bounty
    const isCurator = await database.curator.findFirst({
      where: {
        userId: orgAuth.userId,
        bountyId: submission.bountyId,
      },
    });

    const hasPermission = isOwnerOrAdmin || isCurator;
    if (!hasPermission) {
      return NextResponse.json(
        { error: "You don't have permission to review submissions" },
        { status: 403 }
      );
    }

    // If clearing SPAM, ensure submission is currently SPAM
    if (isClearingSpam && submission.status !== "SPAM") {
      return NextResponse.json(
        {
          error: "Submission is not marked as SPAM",
        },
        { status: 400 }
      );
    }

    // Update submission status
    const updatedSubmission = await database.submission.update({
      where: {
        id: (await params).submissionId,
      },
      data: {
        status: isClearingSpam ? "SUBMITTED" : "SPAM",
        reviewedAt: new Date(),
        position: null,
        winningAmount: null,
        winningAmountUSD: null,
        isWinner: false,
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
      message: isClearingSpam
        ? "Submission unmarked as SPAM successfully"
        : "Submission marked as SPAM successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error);
      return NextResponse.json(formattedError, { status: 400 });
    }

    console.error("Error updating submission review status:", error);
    return NextResponse.json(
      { error: "Failed to update submission review status" },
      { status: 500 }
    );
  }
}
