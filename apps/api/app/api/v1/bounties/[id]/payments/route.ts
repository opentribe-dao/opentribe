import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendPaymentConfirmationEmail } from "@packages/email";

// Schema for payment creation
const createPaymentSchema = z.object({
  submissionId: z.string(),
  extrinsicHash: z.string(),
  amount: z.number().positive(),
  token: z.string(),
});

// GET /api/v1/bounties/[id]/payments - Get payments for a bounty
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bountyId } = await params;

    // Get the bounty and check permissions
    const bounty = await database.bounty.findUnique({
      where: { id: bountyId },
      include: {
        organization: {
          include: {
            members: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    if (bounty.organization.members.length === 0) {
      return NextResponse.json(
        {
          error: "You do not have permission to view payments for this bounty",
        },
        { status: 403 }
      );
    }

    // Get all payments for submissions in this bounty
    const payments = await database.payment.findMany({
      where: {
        submission: {
          bountyId: bountyId,
        },
      },
      include: {
        submission: {
          include: {
            submitter: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                walletAddress: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      payments,
      total: payments.length,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST /api/v1/bounties/[id]/payments - Record a payment
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bountyId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createPaymentSchema.parse(body);

    // Get the submission and verify it belongs to this bounty
    const submission = await database.submission.findUnique({
      where: { id: validatedData.submissionId },
      include: {
        bounty: {
          include: {
            organization: {
              include: {
                members: {
                  where: {
                    userId: session.user.id,
                    role: {
                      in: ["owner", "admin"],
                    },
                  },
                },
              },
            },
          },
        },
        submitter: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    if (submission.bountyId !== bountyId) {
      return NextResponse.json(
        { error: "Submission does not belong to this bounty" },
        { status: 400 }
      );
    }

    if (submission.bounty.organization.members.length === 0) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to record payments for this bounty",
        },
        { status: 403 }
      );
    }

    if (!submission.isWinner) {
      return NextResponse.json(
        { error: "Cannot record payment for non-winning submission" },
        { status: 400 }
      );
    }

    // Check if payment already exists for this submission
    const existingPayment = await database.payment.findFirst({
      where: {
        submissionId: validatedData.submissionId,
        status: {
          in: ["CONFIRMED", "PROCESSING"],
        },
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "Payment already recorded for this submission" },
        { status: 400 }
      );
    }

    // Create the payment record
    const payment = await database.payment.create({
      data: {
        submissionId: validatedData.submissionId,
        organizationId: submission.bounty.organizationId,
        recipientAddress: submission.submitter.walletAddress || "",
        amount: validatedData.amount,
        token: validatedData.token,
        extrinsicHash: validatedData.extrinsicHash,
        status: "CONFIRMED", // Since they're providing the tx hash, we assume it's confirmed
        paidBy: session.user.id, // Add the user who is recording the payment
        paidAt: new Date(), // Set the payment date
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        submission: {
          include: {
            submitter: true,
          },
        },
      },
    });

    // Send payment confirmation email
    try {
      if (submission.submitter.email) {
        await sendPaymentConfirmationEmail(
          {
            email: submission.submitter.email,
            firstName: submission.submitter.firstName || undefined,
            username: submission.submitter.username || undefined,
          },
          {
            id: submission.bounty.id,
            title: submission.bounty.title,
            organization: {
              name: submission.bounty.organization.name,
            },
          },
          {
            amount: String(validatedData.amount),
            token: validatedData.token,
            transactionId: validatedData.extrinsicHash,
          }
        );
      }
    } catch (emailError) {
      console.error("Failed to send payment confirmation email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      payment,
      message: "Payment recorded successfully",
    });
  } catch (error) {
    console.error("Payment recording error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: z.treeifyError(error) },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
  });
}
