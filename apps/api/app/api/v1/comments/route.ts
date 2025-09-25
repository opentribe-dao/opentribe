import { env } from "@/env";
import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { sendCommentReplyEmail } from "@packages/email";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function OPTIONS() {
  return NextResponse.json({});
}

// Schema for comment creation
const createCommentSchema = z
  .object({
    body: z.string().min(1).max(5000),
    parentId: z.string().cuid().optional(),
    rfpId: z.string().cuid().optional(),
    bountyId: z.string().cuid().optional(),
    applicationId: z.string().cuid().optional(),
    submissionId: z.string().cuid().optional(),
    type: z
      .enum([
        "NORMAL",
        "SUBMISSION",
        "DEADLINE_EXTENSION",
        "WINNER_ANNOUNCEMENT",
      ])
      .default("NORMAL"),
  })
  .refine(
    (data) => {
      const targets = [
        data.rfpId,
        data.bountyId,
        data.applicationId,
        data.submissionId,
      ].filter(Boolean);
      return targets.length === 1;
    },
    {
      message:
        "Exactly one target (rfpId, bountyId, applicationId, or submissionId) must be provided",
    }
  );

// GET /api/v1/comments - Get comments for a specific entity
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rfpId = searchParams.get("rfpId");
    const bountyId = searchParams.get("bountyId");
    const applicationId = searchParams.get("applicationId");
    const submissionId = searchParams.get("submissionId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Validate that exactly one ID is provided
    const providedIds = [rfpId, bountyId, applicationId, submissionId].filter(
      Boolean
    );
    if (providedIds.length !== 1) {
      return NextResponse.json(
        {
          error:
            "Exactly one of rfpId, bountyId, applicationId, or submissionId must be provided",
        },
        { status: 400 }
      );
    }

    // Build where clause
    const where = {
      ...(rfpId && { rfpId }),
      ...(bountyId && { bountyId }),
      ...(applicationId && { applicationId }),
      ...(submissionId && { submissionId }),
      parentId: null, // Only get top-level comments
    };

    // Get comments with nested replies
    const comments = await database.comment.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            name: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                name: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await database.comment.count({ where });

    return NextResponse.json({
      comments,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/v1/comments - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // Create comment and update count in a transaction
    const result = await database.$transaction(async (tx) => {
      // Create the comment
      const comment = await tx.comment.create({
        data: {
          body: validatedData.body,
          authorId: sessionData.user.id,
          parentId: validatedData.parentId,
          rfpId: validatedData.rfpId,
          bountyId: validatedData.bountyId,
          applicationId: validatedData.applicationId,
          submissionId: validatedData.submissionId,
          type: validatedData.type,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              name: true,
            },
          },
        },
      });

      // Update comment count on the parent entity
      if (validatedData.rfpId) {
        await tx.rFP.update({
          where: { id: validatedData.rfpId },
          data: { commentCount: { increment: 1 } },
        });
      } else if (validatedData.bountyId) {
        await tx.bounty.update({
          where: { id: validatedData.bountyId },
          data: { commentCount: { increment: 1 } },
        });
      } else if (validatedData.applicationId) {
        await tx.grantApplication.update({
          where: { id: validatedData.applicationId },
          data: { commentCount: { increment: 1 } },
        });
      } else if (validatedData.submissionId) {
        await tx.submission.update({
          where: { id: validatedData.submissionId },
          data: { commentCount: { increment: 1 } },
        });
      }

      return comment;
    });

    // Send email notification if this is a reply
    if (validatedData.parentId) {
      try {
        // Fetch parent comment with author details
        const parentComment = await database.comment.findUnique({
          where: { id: validatedData.parentId },
          include: {
            author: {
              select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
              },
            },
            bounty: {
              select: {
                id: true,
                title: true,
              },
            },
            rfp: {
              select: {
                id: true,
                title: true,
              },
            },
            application: {
              select: {
                id: true,
                grant: {
                  select: {
                    title: true,
                  },
                },
              },
            },
            submission: {
              select: {
                id: true,
                title: true,
                bounty: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        });

        // Only send email if parent comment author is different from reply author
        if (parentComment && parentComment.author.id !== sessionData.user.id) {
          let contextType:
            | "grant"
            | "bounty"
            | "rfp"
            | "submission"
            | "application" = "bounty";
          let contextTitle = "";
          let threadUrl = "";

          if (parentComment.bounty) {
            contextType = "bounty";
            contextTitle = parentComment.bounty.title;
            threadUrl = `${env.NEXT_PUBLIC_WEB_URL}/bounties/${parentComment.bounty.id}#comment-${result.id}`;
          } else if (parentComment.rfp) {
            contextType = "rfp";
            contextTitle = parentComment.rfp.title;
            threadUrl = `${env.NEXT_PUBLIC_WEB_URL}/rfps/${parentComment.rfp.id}#comment-${result.id}`;
          } else if (parentComment.application) {
            contextType = "application";
            contextTitle = parentComment.application.grant.title;
            threadUrl = `${env.NEXT_PUBLIC_WEB_URL}/grants/${parentComment.applicationId}#comment-${result.id}`;
          } else if (parentComment.submission) {
            contextType = "submission";
            contextTitle =
              parentComment.submission.title ||
              parentComment.submission.bounty.title;
            threadUrl = `${env.NEXT_PUBLIC_WEB_URL}/bounties/${parentComment.submissionId}#comment-${result.id}`;
          }

          // TODO: Implement sendCommentReplyEmail in @packages/email
          // await sendCommentReplyEmail(
          //   {
          //     email: parentComment.author.email,
          //     firstName: parentComment.author.firstName || undefined,
          //     username: parentComment.author.username || undefined,
          //   },
          //   result.author.username || 'Someone',
          //   parentComment.body.substring(0, 200) + (parentComment.body.length > 200 ? '...' : ''),
          //   result.body,
          //   contextType,
          //   contextTitle,
          //   threadUrl
          // );
        }
      } catch (emailError) {
        console.error("Failed to send comment reply notification:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ comment: result }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
