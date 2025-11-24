import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { PaymentService } from "@packages/polkadot/server";
import { formatZodError } from "@/lib/zod-errors";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for payment verification
const verifyPaymentSchema = z.object({
  extrinsicHash: z.string(),
  expectedTo: z.string(),
  expectedAmount: z.string(),
});

// POST /api/v1/payments/verify - Verify a payment on the blockchain
export async function POST(request: NextRequest) {
  try {
    // Get the session from Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await database.user.findUnique({
      where: { id: session.user.id },
    });

    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user?.walletAddress) {
      return NextResponse.json(
        { error: "No user wallet address found" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = verifyPaymentSchema.parse(body);

    // Development mode: Accept test transactions
    if (
      (process.env.NODE_ENV === "development" ||
        process.env.VERCEL_TARGET_ENV === "staging") &&
      validatedData.extrinsicHash.startsWith("0xtest")
    ) {
      return NextResponse.json({
        verified: true,
        details: {
          blockNumber: 12_345_678,
          from: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
          to: validatedData.expectedTo,
          amount: validatedData.expectedAmount,
          fee: "0.01",
        },
        message: "Payment verified successfully (development mode)",
      });
    }

    // Initialize payment service (uses Dedot + Subscan under the hood)
    const payments = new PaymentService("polkadot");

    // Verify the transaction
    const result = await payments.verifyPayment({
      extrinsicHash: validatedData.extrinsicHash,
      fromAddress: user?.walletAddress,
      toAddress: validatedData.expectedTo,
      expectedAmount: validatedData.expectedAmount,
    });

    if (result.verified) {
      return NextResponse.json({
        verified: true,
        details: result.details,
        message: "Payment verified successfully on the blockchain",
      });
    }

    return NextResponse.json(
      {
        verified: false,
        error: result.error || "Payment verification failed",
      },
      {
        status: 400,
      }
    );
    // No persistent connection to close; PaymentService verifies via Subscan
  } catch (error) {
    console.error("Payment verification error:", error);

    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error);
      return NextResponse.json(formattedError, { status: 400 });
    }

    return NextResponse.json(
      {
        verified: false,
        error:
          "Failed to verify payment. Please check the transaction hash and try again.",
      },
      {
        status: 500,
      }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
  });
}
