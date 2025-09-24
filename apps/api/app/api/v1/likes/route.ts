import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function OPTIONS() {
  return NextResponse.json({});
}

// Schema for like creation
const createLikeSchema = z
  .object({
    applicationId: z.string().cuid().optional(),
    submissionId: z.string().cuid().optional(),
  })
  .refine((data) => data.applicationId || data.submissionId, {
    message: "Either applicationId or submissionId must be provided",
  })
  .refine((data) => !(data.applicationId && data.submissionId), {
    message: "Cannot like both application and submission at the same time",
  });

// POST /api/v1/likes - Create a like
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
    const validatedData = createLikeSchema.parse(body);

    // Check if like already exists
    const existingLike = await database.like.findFirst({
      where: {
        userId: sessionData.user.id,
        ...(validatedData.applicationId && {
          applicationId: validatedData.applicationId,
        }),
        ...(validatedData.submissionId && {
          submissionId: validatedData.submissionId,
        }),
      },
    });

    if (existingLike) {
      return NextResponse.json({ error: "Already liked" }, { status: 400 });
    }

    // Create like and update count in a transaction
    const result = await database.$transaction(async (tx) => {
      // Create the like
      const like = await tx.like.create({
        data: {
          userId: sessionData.user.id,
          ...(validatedData.applicationId && {
            applicationId: validatedData.applicationId,
          }),
          ...(validatedData.submissionId && {
            submissionId: validatedData.submissionId,
          }),
        },
      });

      // Update the likes count
      if (validatedData.applicationId) {
        await tx.grantApplication.update({
          where: { id: validatedData.applicationId },
          data: { likesCount: { increment: 1 } },
        });
      } else if (validatedData.submissionId) {
        await tx.submission.update({
          where: { id: validatedData.submissionId },
          data: { likesCount: { increment: 1 } },
        });
      }

      return like;
    });

    return NextResponse.json(
      {
        success: true,
        like: {
          id: result.id,
          userId: result.userId,
          applicationId: result.applicationId,
          submissionId: result.submissionId,
          createdAt: result.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating like:", error);
    return NextResponse.json(
      { error: "Failed to create like" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/likes - Remove a like
export async function DELETE(request: NextRequest) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");
    const submissionId = searchParams.get("submissionId");

    if (!applicationId && !submissionId) {
      return NextResponse.json(
        { error: "Either applicationId or submissionId must be provided" },
        { status: 400 }
      );
    }

    if (applicationId && submissionId) {
      return NextResponse.json(
        { error: "Cannot specify both applicationId and submissionId" },
        { status: 400 }
      );
    }

    // Find the like
    const like = await database.like.findFirst({
      where: {
        userId: sessionData.user.id,
        ...(applicationId && { applicationId }),
        ...(submissionId && { submissionId }),
      },
    });

    if (!like) {
      return NextResponse.json({ error: "Like not found" }, { status: 404 });
    }

    // Delete like and update count in a transaction
    await database.$transaction(async (tx) => {
      // Delete the like
      await tx.like.delete({
        where: { id: like.id },
      });

      // Update the likes count
      if (applicationId) {
        await tx.grantApplication.update({
          where: { id: applicationId },
          data: { likesCount: { decrement: 1 } },
        });
      } else if (submissionId) {
        await tx.submission.update({
          where: { id: submissionId },
          data: { likesCount: { decrement: 1 } },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing like:", error);
    return NextResponse.json(
      { error: "Failed to remove like" },
      { status: 500 }
    );
  }
}
