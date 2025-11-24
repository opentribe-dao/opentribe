import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { formatZodError } from "@/lib/zod-errors";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function OPTIONS() {
  return NextResponse.json({});
}

// Schema for vote creation/update
const voteSchema = z.object({
  rfpId: z.string().cuid(),
  direction: z.enum(["UP", "DOWN"]),
});

// GET /api/v1/votes - Get user's votes
export async function GET(request: NextRequest) {
  try {
    const authHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: authHeaders,
    });

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rfpIds = searchParams.get("rfpIds")?.split(",").filter(Boolean) || [];

    if (rfpIds.length === 0) {
      return NextResponse.json(
        { error: "No RFP IDs provided" },
        { status: 400 }
      );
    }

    // Get user's votes for the specified RFPs
    const votes = await database.vote.findMany({
      where: {
        userId: sessionData.user.id,
        rfpId: { in: rfpIds },
      },
      select: {
        rfpId: true,
        direction: true,
      },
    });

    // Create a map of votes
    const voteMap = Object.fromEntries(
      votes.map((vote) => [vote.rfpId, vote.direction])
    );

    return NextResponse.json({ votes: voteMap });
  } catch (error) {
    console.error("Error fetching votes:", error);
    return NextResponse.json(
      { error: "Failed to fetch votes" },
      { status: 500 }
    );
  }
}

// POST /api/v1/votes - Create or update a vote
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
    const validatedData = voteSchema.parse(body);

    // Check if RFP exists
    const rfp = await database.rFP.findUnique({
      where: { id: validatedData.rfpId },
    });

    if (!rfp) {
      return NextResponse.json({ error: "RFP not found" }, { status: 404 });
    }

    // Check if vote already exists
    const existingVote = await database.vote.findUnique({
      where: {
        userId_rfpId: {
          userId: sessionData.user.id,
          rfpId: validatedData.rfpId,
        },
      },
    });

    // Handle vote in a transaction
    const result = await database.$transaction(async (tx) => {
      let vote: any;
      let voteCountChange = 0;

      if (existingVote) {
        if (existingVote.direction === validatedData.direction) {
          // Same vote direction, no change needed
          return existingVote;
        }

        // Update vote direction
        vote = await tx.vote.update({
          where: { id: existingVote.id },
          data: { direction: validatedData.direction },
        });

        // Vote changed from UP to DOWN or vice versa
        voteCountChange = validatedData.direction === "UP" ? 2 : -2;
      } else {
        // Create new vote
        vote = await tx.vote.create({
          data: {
            userId: sessionData.user.id,
            rfpId: validatedData.rfpId,
            direction: validatedData.direction,
          },
        });

        // New vote
        voteCountChange = validatedData.direction === "UP" ? 1 : -1;
      }

      // Update RFP vote count
      if (voteCountChange !== 0) {
        await tx.rFP.update({
          where: { id: validatedData.rfpId },
          data: { voteCount: { increment: voteCountChange } },
        });
      }

      return vote;
    });

    return NextResponse.json(
      {
        vote: {
          id: result.id,
          userId: result.userId,
          rfpId: result.rfpId,
          direction: result.direction,
          createdAt: result.createdAt,
        },
      },
      { status: existingVote ? 200 : 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error);
      return NextResponse.json(formattedError, { status: 400 });
    }

    console.error("Error creating/updating vote:", error);
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/votes - Remove a vote
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
    const rfpId = searchParams.get("rfpId");

    if (!rfpId) {
      return NextResponse.json(
        { error: "RFP ID is required" },
        { status: 400 }
      );
    }

    // Find the vote
    const vote = await database.vote.findUnique({
      where: {
        userId_rfpId: {
          userId: sessionData.user.id,
          rfpId,
        },
      },
    });

    if (!vote) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 });
    }

    // Delete vote and update count in a transaction
    await database.$transaction(async (tx) => {
      // Delete the vote
      await tx.vote.delete({
        where: { id: vote.id },
      });

      // Update RFP vote count
      const voteCountChange = vote.direction === "UP" ? -1 : 1;
      await tx.rFP.update({
        where: { id: rfpId },
        data: { voteCount: { increment: voteCountChange } },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing vote:", error);
    return NextResponse.json(
      { error: "Failed to remove vote" },
      { status: 500 }
    );
  }
}
