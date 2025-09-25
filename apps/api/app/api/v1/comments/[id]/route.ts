import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function OPTIONS() {
  return NextResponse.json({});
}

// Schema for comment update
const updateCommentSchema = z.object({
  body: z.string().min(1).max(5000),
});

// PATCH /api/v1/comments/[id] - Update a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateCommentSchema.parse(body);

    // Check if comment exists and user owns it
    const comment = await database.comment.findUnique({
      where: { id: (await params).id },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.authorId !== sessionData.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update the comment
    const updatedComment = await database.comment.update({
      where: { id: (await params).id },
      data: {
        body: validatedData.body,
        isEdited: true,
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

    return NextResponse.json({ comment: updatedComment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: z.treeifyError(error) },
        { status: 400 }
      );
    }

    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/comments/[id] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if comment exists and user owns it
    const comment = await database.comment.findUnique({
      where: { id: (await params).id },
      include: {
        replies: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.authorId !== sessionData.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If comment has replies, just hide it instead of deleting
    if (comment.replies.length > 0) {
      await database.comment.update({
        where: { id: (await params).id },
        data: {
          body: "[Deleted]",
          isHidden: true,
        },
      });
    } else {
      // Delete comment and update count in a transaction
      await database.$transaction(async (tx) => {
        // Delete the comment
        await tx.comment.delete({
          where: { id: (await params).id },
        });

        // Update comment count on the parent entity
        if (comment.rfpId) {
          await tx.rFP.update({
            where: { id: comment.rfpId },
            data: { commentCount: { decrement: 1 } },
          });
        } else if (comment.bountyId) {
          await tx.bounty.update({
            where: { id: comment.bountyId },
            data: { commentCount: { decrement: 1 } },
          });
        } else if (comment.applicationId) {
          await tx.grantApplication.update({
            where: { id: comment.applicationId },
            data: { commentCount: { decrement: 1 } },
          });
        } else if (comment.submissionId) {
          await tx.submission.update({
            where: { id: comment.submissionId },
            data: { commentCount: { decrement: 1 } },
          });
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
