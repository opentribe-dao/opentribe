import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { exchangeRateService } from "@packages/polkadot/server";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrganizationAuth, hasRequiredRole } from "@/lib/organization-auth";

export async function OPTIONS() {
  return NextResponse.json({});
}

/**
 * Position Assignment Endpoint
 *
 * PATCH /api/v1/bounties/[id]/submissions/[submissionId]/position
 *
 * This endpoint handles winner position assignment for bounty submissions.
 *
 * KEY DESIGN DECISION: Winners are determined by position assignment ONLY, not by submission status.
 * The status field (SUBMITTED, SPAM, WITHDRAWN) is used for submission lifecycle management,
 * but has NO impact on winner selection. A submission with position !== null is a winner,
 * regardless of its status (except SPAM submissions are excluded from public winner displays).
 *
 * Position Conflict Resolution:
 * - If a position is already assigned to another submission, it is automatically unassigned
 *   from that submission (position set to null, winningAmount set to null)
 * - The position is then assigned to the current submission
 * - This ensures only one submission can have a given position at any time
 *
 * Important: This endpoint does NOT change submission status. Status remains unchanged
 * during position assignment/clearing. This separation allows for flexible workflows where
 * submissions can be marked as SPAM or WITHDRAWN independently of their winner status.
 *
 * @param request - Request body: { position: number | null }
 * @param params - Route parameters: { id: bountyId, submissionId }
 * @returns Updated submission with position and winningAmount set
 */
export function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  return handlePositionPatch(request, params);
}

async function handlePositionPatch(
  request: NextRequest,
  params: Promise<{ id: string; submissionId: string }>
) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const positionSchema = z.object({
      position: z.number().int().positive().nullable(),
    });

    const body = await request.json();
    const validatedData = positionSchema.parse(body);
    const { id: bountyId, submissionId } = await params;

    // Fetch submission to check permissions
    const submission = await database.submission.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        bounty: true,
      },
    });

    if (!submission || submission.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to assign positions
    const orgAuth = await getOrganizationAuth(
      request,
      submission.bounty.organizationId,
      { session: sessionData }
    );
    if (!orgAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasRequiredRole(orgAuth.membership, ["owner", "admin"])) {
      return NextResponse.json(
        { error: "You don't have permission to assign positions" },
        { status: 403 }
      );
    }

    let winningAmount: number | null = null;

    // If assigning a position (not clearing)
    if (validatedData.position !== null) {
      const validationResult = validateWinningAmount(
        submission.bounty.winnings as Record<string, number> | null,
        validatedData.position
      );

      if ("errorResponse" in validationResult) {
        return validationResult.errorResponse;
      }

      winningAmount = validationResult.winningAmount;

      // Validate that winningAmount is not null and greater than 0
      if (winningAmount === null || winningAmount <= 0) {
        return NextResponse.json(
          { error: "Invalid winning amount: must be greater than 0" },
          { status: 400 }
        );
      }
    }

    // Calculate winningAmountUSD if we have a winningAmount
    let winningAmountUSD: number | null = null;
    if (winningAmount !== null) {
      // Missing token means we can't convert to USD and should fail fast
      if (!submission.bounty.token) {
        return NextResponse.json(
          {
            error: "Failed to fetch exchange rate for token. Please try again.",
          },
          { status: 500 }
        );
      }

      try {
        const token = submission.bounty.token.toUpperCase();
        const exchangeRates = await exchangeRateService.getExchangeRates([
          submission.bounty.token,
        ]);
        const rate = exchangeRates[token];

        if (rate && rate > 0) {
          winningAmountUSD = winningAmount * rate;
        } else {
          // If we can't get a valid exchange rate, fail the request
          // This ensures data consistency - we don't want incomplete position assignments
          return NextResponse.json(
            {
              error:
                "Failed to fetch exchange rate for token. Please try again.",
            },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error);
        return NextResponse.json(
          {
            error: "Failed to fetch exchange rate for token. Please try again.",
          },
          { status: 500 }
        );
      }
    }

    const { updatedSubmission, previousSubmissionId } =
      await runPositionTransaction({
        bountyId,
        submissionId,
        position: validatedData.position,
        winningAmount,
        winningAmountUSD,
      });

    return NextResponse.json({
      submission: updatedSubmission,
      message: buildPositionMessage(
        validatedData.position,
        previousSubmissionId
      ),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: z.treeifyError(error) },
        { status: 400 }
      );
    }

    console.error("Error assigning position:", error);
    return NextResponse.json(
      { error: "Failed to assign position" },
      { status: 500 }
    );
  }
}

function runPositionTransaction({
  bountyId,
  submissionId,
  position,
  winningAmount,
  winningAmountUSD,
}: {
  bountyId: string;
  submissionId: string;
  position: number | null;
  winningAmount: number | null;
  winningAmountUSD: number | null;
}) {
  return database.$transaction(async (tx) => {
    let displacedSubmissionId: string | null = null;

    if (position !== null) {
      // POSITION CONFLICT RESOLUTION:
      // Check if position is already assigned to another submission
      // If yes, automatically unassign it from that submission before assigning to current one
      // This ensures only one submission can have a given position at any time
      const existingWinner = await tx.submission.findFirst({
        where: {
          bountyId,
          position,
          NOT: {
            id: submissionId,
          },
        },
      });

      // If position is already taken, unassign it from the previous submission
      // This is done automatically, no need for manual intervention
      if (existingWinner) {
        displacedSubmissionId = existingWinner.id;
        await tx.submission.update({
          where: {
            id: existingWinner.id,
          },
          data: {
            position: null,
            winningAmount: null,
            winningAmountUSD: null,
            isWinner: false,
          },
        });
      }
    }

    // Update current submission with position assignment
    // IMPORTANT: Status is NOT changed - it remains SUBMITTED, SPAM, or WITHDRAWN
    // Winners are determined by position !== null ONLY, not by status
    const updated = await tx.submission.update({
      where: {
        id: submissionId,
      },
      data: {
        position,
        winningAmount,
        winningAmountUSD,
        isWinner: position !== null,
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

    return {
      updatedSubmission: updated,
      previousSubmissionId: displacedSubmissionId,
    };
  });
}

function validateWinningAmount(
  winningsObj: Record<string, number> | null,
  position: number
): { winningAmount: number } | { errorResponse: NextResponse } {
  const positionKey = String(position);
  const hasPositionKey =
    winningsObj !== null && Object.hasOwn(winningsObj, positionKey);

  if (!hasPositionKey) {
    return {
      errorResponse: NextResponse.json(
        { error: "Invalid winner position" },
        { status: 400 }
      ),
    };
  }

  const value = winningsObj?.[positionKey];

  if (typeof value !== "number" || value <= 0) {
    return {
      errorResponse: NextResponse.json(
        { error: "Invalid winning amount: must be greater than 0" },
        { status: 400 }
      ),
    };
  }

  return { winningAmount: value };
}

function buildPositionMessage(
  position: number | null,
  previousSubmissionId: string | null
) {
  if (position === null) {
    return "Position cleared successfully";
  }
  if (previousSubmissionId) {
    return `Position ${position} reassigned successfully`;
  }
  return `Position ${position} assigned successfully`;
}
