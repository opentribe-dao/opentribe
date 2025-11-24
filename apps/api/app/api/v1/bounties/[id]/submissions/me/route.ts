import { OPTIONAL_URL_REGEX, URL_REGEX } from "@packages/base/lib/utils";
import { database } from "@packages/db";
import { getSubmissionAuth } from "@/lib/submission-auth";
import { formatZodError } from "@/lib/zod-errors";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function OPTIONS() {
  return NextResponse.json({});
}

// Schema for submission update
const updateSubmissionSchema = z.object({
  submissionUrl: z
    .string()
    .regex(OPTIONAL_URL_REGEX, {
      message: "Invalid URL format for submission URL",
    })
    .optional()
    .or(z.literal("")),
  title: z
    .string()
    .min(1, { message: "Title must be at least 1 character" })
    .max(200, { message: "Title must be at most 200 characters" })
    .optional(),
  description: z.string().optional(),
  attachments: z
    .array(
      z
        .string()
        .regex(URL_REGEX, { message: "Invalid URL format for attachment" })
    )
    .optional(),
  responses: z
    .record(
      z.string(),
      z.union([z.string(), z.boolean()], {
        message: "Response must be a string or boolean",
      })
    )
    .optional(),
});

// GET /api/v1/bounties/[id]/submissions/me - Get current user's submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const bountyId = (await params).id;
    const authResult = await getSubmissionAuth(request, bountyId);

    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Fetch full submission details
    const submission = await database.submission.findUnique({
      where: {
        id: authResult.submissionId,
      },
      include: {
        submitter: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            image: true,
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

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("Error fetching user submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/bounties/[id]/submissions/me - Update current user's submission
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const bountyId = (await params).id;
    const authResult = await getSubmissionAuth(request, bountyId);

    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    let validatedData;
    try {
      validatedData = updateSubmissionSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedError = formatZodError(error);
        return NextResponse.json(formattedError, { status: 400 });
      }
      throw error;
    }

    // Get the submission to check if it's a winner
    const submission = await database.submission.findUnique({
      where: {
        id: authResult.submissionId,
      },
      select: {
        id: true,
        isWinner: true,
        bounty: {
          select: {
            status: true,
            deadline: true,
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

    // Check if submission is a winner (cannot edit winning submissions)
    if (submission.isWinner) {
      return NextResponse.json(
        { error: "Cannot edit a winning submission" },
        { status: 400 }
      );
    }

    // Check if bounty is closed or deadline has passed
    if (
      submission.bounty.status !== "OPEN" ||
      (submission.bounty.deadline &&
        new Date(submission.bounty.deadline) < new Date())
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot edit submission. Bounty is closed or deadline has passed",
        },
        { status: 400 }
      );
    }

    // Prepare update data (only include fields that were provided)
    const updateData: any = {};
    if (validatedData.submissionUrl !== undefined) {
      updateData.submissionUrl =
        validatedData.submissionUrl === "" ? null : validatedData.submissionUrl;
    }
    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.attachments !== undefined) {
      updateData.attachments = validatedData.attachments;
    }
    if (validatedData.responses !== undefined) {
      updateData.responses = validatedData.responses;
    }

    // Update the submission
    const updatedSubmission = await database.submission.update({
      where: {
        id: authResult.submissionId,
      },
      data: updateData,
    });

    return NextResponse.json({
      message: "Submission updated successfully",
      submission: updatedSubmission,
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error);
      return NextResponse.json(formattedError, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/bounties/[id]/submissions/me - Delete current user's submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const bountyId = (await params).id;
    const authResult = await getSubmissionAuth(request, bountyId);

    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    // Get the submission to check if it's a winner
    const submission = await database.submission.findUnique({
      where: {
        id: authResult.submissionId,
      },
      select: {
        id: true,
        isWinner: true,
        bounty: {
          select: {
            status: true,
            deadline: true,
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

    // Check if submission is a winner (cannot delete winning submissions)
    if (submission.isWinner) {
      return NextResponse.json(
        { error: "Cannot delete a winning submission" },
        { status: 400 }
      );
    }

    // Check if bounty is closed or deadline has passed
    if (
      submission.bounty.status !== "OPEN" ||
      (submission.bounty.deadline &&
        new Date(submission.bounty.deadline) < new Date())
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete submission. Bounty is closed or deadline has passed",
        },
        { status: 400 }
      );
    }

    // Delete the submission
    await database.submission.delete({
      where: {
        id: authResult.submissionId,
      },
    });

    // Update bounty submission count
    await database.bounty.update({
      where: { id: authResult.bountyId },
      data: {
        submissionCount: {
          decrement: 1,
        },
      },
    });

    return NextResponse.json({
      message: "Submission deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting submission:", error);
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 }
    );
  }
}
