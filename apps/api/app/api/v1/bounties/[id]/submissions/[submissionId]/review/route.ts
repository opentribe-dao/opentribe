import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { formatZodError } from "@/lib/zod-errors";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationAuth, hasRequiredRole } from "@/lib/organization-auth";

export async function OPTIONS() {
  return NextResponse.json({});
}

/**
 * SPAM Review Endpoint
 * 
 * PATCH /api/v1/bounties/[id]/submissions/[submissionId]/review
 * 
 * This endpoint handles marking submissions as SPAM and unmarking them (replaces the old REJECTED status).
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
 * Unmarking SPAM:
 * - Only submissions currently marked as SPAM can be unmarked
 * - Unmarking restores status to SUBMITTED
 * - Position, winningAmount, and winningAmountUSD are preserved when unmarking
 * - Only organization owners/admins can unmark SPAM submissions
 * 
 * Winner Protection:
 * - If submission has position !== null, return 400 error when marking as SPAM
 * - Admin must clear position first, then mark as SPAM
 * - This workflow prevents accidental marking of winners
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
          error: "Invalid request: status 'SUBMITTED' requires action 'CLEAR_SPAM' to unmark SPAM",
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (!hasRequiredRole(orgAuth.membership, ["owner", "admin"])) {
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

    // If marking as SPAM, check winner protection
    // WINNER PROTECTION: Check if submission has a position assigned (is a winner)
    // Winners cannot be marked as SPAM - must clear position first
    // This prevents accidental marking of winners and ensures data integrity
    // Workflow: Admin must first clear position using /position endpoint, then mark as SPAM
    if (!isClearingSpam && submission.position !== null) {
      return NextResponse.json(
        {
          error:
            "Cannot mark winner as SPAM - submission has position assigned. Clear position first.",
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
        // Do NOT change position, winningAmount, or winningAmountUSD when clearing SPAM
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
