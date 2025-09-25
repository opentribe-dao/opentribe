import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function OPTIONS() {
  return NextResponse.json({});
}

// GET /api/v1/bounties/[id]/submissions/[submissionId] - Get submission details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    // Fetch submission with all related data
    const submission = await database.submission.findUnique({
      where: {
        id: (await params).submissionId,
        bountyId: (await params).id,
      },
      include: {
        bounty: {
          select: {
            id: true,
            title: true,
            organizationId: true,
            amount: true, // Use amount instead of totalAmount
            token: true,
            winnersAnnouncedAt: true,
            winnings: true, // This is a JSON field
            submissions: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
        submitter: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            location: true,
            bio: true,
            skills: true,
            github: true,
            linkedin: true,
            twitter: true,
            website: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Check if this is a public submission (winners announced)
    const isPublic = submission.bounty.winnersAnnouncedAt !== null;

    if (!isPublic) {
      // For non-public submissions, require authentication
      const authHeaders = await headers();
      const sessionData = await auth.api.getSession({
        headers: authHeaders,
      });

      if (!sessionData?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Check if user is the creator of the submission
      const isCreator = submission.userId === sessionData.user.id;

      if (!isCreator) {
        // If not the creator, check if user has organization membership
        const userMember = await database.member.findFirst({
          where: {
            organizationId: submission.bounty.organizationId,
            userId: sessionData.user.id,
          },
        });

        // Only organization members can view non-public submissions they didn't create
        if (!userMember) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    // Calculate winnerCount from winnings JSON
    const winningsArray = submission.bounty.winnings
      ? Object.entries(submission.bounty.winnings as any).map(
          ([position, amount]) => ({
            position: parseInt(position),
            amount: Number(amount),
          })
        )
      : [];

    const winnerCount = winningsArray.length;
    const totalAmount = Number(submission.bounty.amount || 0);

    // Transform the submission data - map to what the dashboard expects
    const transformedSubmission = {
      id: submission.id,
      title: submission.title,
      description: submission.description,
      submissionUrl: submission.submissionUrl,
      status: submission.status,
      isWinner: submission.isWinner,
      position: submission.position,
      winningAmount: submission.winningAmount,
      createdAt: submission.createdAt,
      submittedAt: submission.submittedAt,
      reviewedAt: submission.reviewedAt,
      feedback: submission.notes, // notes field is used for feedback
      answers: submission.responses as any, // responses contains screening answers
      files: [], // files field doesn't exist in schema
      bounty: {
        id: submission.bounty.id,
        title: submission.bounty.title,
        organizationId: submission.bounty.organizationId,
        winnerCount: winnerCount, // Calculate from winnings
        totalAmount: totalAmount, // Use amount field
        token: submission.bounty.token,
        winnersAnnouncedAt: submission.bounty.winnersAnnouncedAt,
        winnings: winningsArray,
        submissions: submission.bounty.submissions,
      },
      // Dashboard expects 'creator' field, but DB has 'submitter'
      creator: {
        id: submission.submitter.id,
        username: submission.submitter.username,
        firstName: submission.submitter.firstName,
        lastName: submission.submitter.lastName,
        avatarUrl: submission.submitter.avatarUrl,
        email: isPublic ? undefined : submission.submitter.email, // Hide email for public submissions
        location: submission.submitter.location,
        bio: submission.submitter.bio,
        skills: Array.isArray(submission.submitter.skills)
          ? submission.submitter.skills
          : (submission.submitter.skills as string[] | null) || [],
        github: submission.submitter.github,
        linkedin: submission.submitter.linkedin,
        twitter: submission.submitter.twitter,
        website: submission.submitter.website,
      },
      // Also include submitter for compatibility with web app
      submitter: {
        id: submission.submitter.id,
        username: submission.submitter.username,
        firstName: submission.submitter.firstName,
        lastName: submission.submitter.lastName,
        avatarUrl: submission.submitter.avatarUrl,
        email: isPublic ? undefined : submission.submitter.email,
        location: submission.submitter.location,
        bio: submission.submitter.bio,
        skills: Array.isArray(submission.submitter.skills)
          ? submission.submitter.skills
          : (submission.submitter.skills as string[] | null) || [],
        github: submission.submitter.github,
        linkedin: submission.submitter.linkedin,
        twitter: submission.submitter.twitter,
        website: submission.submitter.website,
      },
    };

    return NextResponse.json({ submission: transformedSubmission });
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}
