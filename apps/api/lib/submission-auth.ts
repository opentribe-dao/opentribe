import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

export interface SubmissionAuth {
  userId: string;
  bountyId: string;
  submissionId: string;
}

/**
 * Get authenticated user's submission for a bounty.
 * This helper extracts the common authentication and submission lookup logic.
 */
export async function getSubmissionAuth(
  request: NextRequest,
  bountyId: string
): Promise<{ error: string; status: number } | SubmissionAuth> {
  // Get session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 };
  }

  // Find the bounty
  const bounty = await database.bounty.findFirst({
    where: {
      OR: [
        { id: bountyId },
        { slug: { equals: bountyId, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
    },
  });

  if (!bounty) {
    return { error: "Bounty not found", status: 404 };
  }

  // Find user's submission for this bounty
  const submission = await database.submission.findFirst({
    where: {
      bountyId: bounty.id,
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc", // Get the most recent submission
    },
    select: {
      id: true,
    },
  });

  if (!submission) {
    return { error: "No submission found", status: 404 };
  }

  return {
    userId: session.user.id,
    bountyId: bounty.id,
    submissionId: submission.id,
  };
}
