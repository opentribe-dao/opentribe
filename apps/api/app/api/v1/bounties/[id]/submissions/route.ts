import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendBountyFirstSubmissionEmail } from "@packages/email";

// Schema for submission creation
const createSubmissionSchema = z.object({
  submissionUrl: z.string().url().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  responses: z.record(z.string(), z.any()).optional(), // For screening question responses
});

// GET /api/v1/bounties/[id]/submissions - Get submissions for a bounty
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the session from Better Auth (optional for public bounties)
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const bountyId = (await params).id;

    // Get the bounty
    const bounty = await database.bounty.findUnique({
      where: { id: bountyId },
      include: {
        organization: {
          select: {
            id: true,
            members: session?.user
              ? {
                  where: {
                    userId: session.user.id,
                  },
                }
              : undefined,
          },
        },
      },
    });

    if (!bounty) {
      return NextResponse.json(
        { error: "Bounty not found" },
        {
          status: 404,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }

    // Check if user can view submissions
    const isOrgMember =
      session?.user &&
      bounty.organization.members &&
      bounty.organization.members.length > 0;

    // For public bounties, only show submitted submissions
    // For org members, show all submissions
    const whereClause: any = {
      bountyId: bountyId,
    };

    if (!isOrgMember) {
      // For public, show all non-draft submissions
      whereClause.status = {
        in: ["SUBMITTED", "APPROVED", "REJECTED"],
      };
    }

    // Get submissions
    const submissions = await database.submission.findMany({
      where: whereClause,
      include: {
        submitter: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: isOrgMember, // Only show email to org members
            avatarUrl: true,
            headline: true,
            skills: true,
            walletAddress: isOrgMember, // Only show wallet address to org members
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
        payments: isOrgMember
          ? {
              select: {
                id: true,
                status: true,
                extrinsicHash: true,
                amount: true,
                token: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: "desc",
              },
            }
          : false,
      },
      orderBy: [
        { isWinner: "desc" },
        { position: "asc" },
        { submittedAt: "desc" },
      ],
    });

    // Add additional stats
    const submissionsWithStats = submissions.map((submission) => ({
      ...submission,
      winningAmount: submission.winningAmount?.toNumber(),
      stats: {
        commentsCount: submission._count.comments,
        likesCount: submission._count.likes,
      },
    }));

    return NextResponse.json(
      {
        submissions: submissionsWithStats,
        total: submissionsWithStats.length,
        isOrgMember,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}

// POST /api/v1/bounties/[id]/submissions - Create a submission
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
      return NextResponse.json(
        { error: "You must be logged in to submit" },
        { status: 401 }
      );
    }

    const bountyId = (await params).id;

    // Check if bounty exists and is open
    const bounty = await database.bounty.findUnique({
      where: { id: bountyId },
      select: {
        id: true,
        title: true,
        status: true,
        visibility: true,
        screening: true,
        organizationId: true,
      },
    });

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    if (bounty.visibility !== "PUBLISHED" || bounty.status !== "OPEN") {
      return NextResponse.json(
        { error: "This bounty is not accepting submissions" },
        { status: 400 }
      );
    }

    // Check if user already has a submission for this bounty
    const existingSubmission = await database.submission.findFirst({
      where: {
        bountyId: bountyId,
        userId: session.user.id,
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: "You have already submitted to this bounty" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createSubmissionSchema.parse(body);

    // Create the submission
    const submission = await database.submission.create({
      data: {
        bountyId: bountyId,
        userId: session.user.id,
        submissionUrl: validatedData.submissionUrl,
        title: validatedData.title || `Submission for ${bounty.title}`,
        description: validatedData.description,
        responses: validatedData.responses || undefined,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
      include: {
        submitter: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update bounty submission count
    await database.bounty.update({
      where: { id: bountyId },
      data: {
        submissionCount: {
          increment: 1,
        },
      },
    });

    // Check if this is the first submission and send email to org members
    const submissionCount = await database.submission.count({
      where: { bountyId: bountyId },
    });

    if (submissionCount === 1) {
      // Get organization members with admin/owner roles
      const orgMembers = await database.member.findMany({
        where: {
          organizationId: bounty.organizationId,
          role: { in: ["owner", "admin"] },
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              username: true,
            },
          },
        },
      });

      // Send first submission email to each admin/owner
      for (const member of orgMembers) {
        if (member.user) {
          try {
            await sendBountyFirstSubmissionEmail(
              {
                email: member.user.email,
                firstName: member.user.firstName || undefined,
                username: member.user.username || undefined,
              },
              {
                id: bounty.id,
                title: bounty.title,
              },
              {
                id: submission.id,
                title: submission.title || "",
                description: submission.description || "",
                submitter: {
                  firstName: submission.submitter.firstName || undefined,
                  username: submission.submitter.username || "Anonymous",
                },
              }
            );
          } catch (error) {
            console.error("Failed to send first submission email:", error);
            // Don't fail the request if email fails
          }
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        submission,
      },
      {
        status: 201,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Submission creation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
