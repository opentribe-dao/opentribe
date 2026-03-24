import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { isSameAddress } from "@packages/polkadot";
import { formatZodError } from "@/lib/zod-errors";
import { processVerifiedClaim } from "@/lib/claim-processing";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signatureVerify } from "@polkadot/util-crypto";

// Schema for verification submission
const verifyClaimSchema = z.object({
  claimId: z.string(),
  // For wallet signature verification
  signature: z.string().optional(),
  address: z.string().optional(),
  // For email verification
  token: z.string().optional(),
  code: z.string().optional(),
});

// POST /api/v1/ecosystem/profiles/{id}/claim/verify - Submit verification proof
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: profileId } = await params;
    const body = await request.json();
    const validated = verifyClaimSchema.parse(body);
    const userId = session.user.id;

    // 1. Find the claim request
    const claim = await database.claimRequest.findUnique({
      where: { id: validated.claimId },
      include: {
        ecosystemProfile: true,
      },
    });

    if (!claim) {
      return NextResponse.json(
        { error: "Claim request not found" },
        { status: 404 }
      );
    }

    // 2. Verify it belongs to this user
    if (claim.userId !== userId) {
      return NextResponse.json(
        { error: "This claim does not belong to you" },
        { status: 403 }
      );
    }

    // 3. Verify it's for the correct profile
    if (claim.ecosystemProfileId !== profileId) {
      return NextResponse.json(
        { error: "Claim does not match this profile" },
        { status: 400 }
      );
    }

    // 4. Check not expired
    if (new Date() > claim.expiresAt) {
      await database.claimRequest.update({
        where: { id: claim.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "This claim has expired. Please initiate a new claim." },
        { status: 410 }
      );
    }

    // 5. Check claim is still pending
    if (claim.status !== "PENDING") {
      return NextResponse.json(
        { error: `This claim is already ${claim.status.toLowerCase()}` },
        { status: 409 }
      );
    }

    // 6. Handle verification based on method
    if (claim.method === "WALLET_SIGNATURE") {
      return handleWalletVerification(claim, validated, userId, profileId);
    }

    if (claim.method === "EMAIL_VERIFICATION") {
      return handleEmailVerification(claim, validated);
    }

    return NextResponse.json(
      { error: "This claim method does not require manual verification" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Claim verification error:", error);

    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error);
      return NextResponse.json(formattedError, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to verify claim" },
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

// --- Helper functions ---

async function handleWalletVerification(
  claim: any,
  validated: z.infer<typeof verifyClaimSchema>,
  userId: string,
  profileId: string
) {
  if (!validated.signature || !validated.address) {
    return NextResponse.json(
      { error: "Signature and address are required for wallet verification" },
      { status: 400 }
    );
  }

  const verificationData = claim.verificationData as any;
  const challenge = verificationData?.challenge;

  if (!challenge) {
    return NextResponse.json(
      { error: "No challenge found for this claim. Please initiate a new claim." },
      { status: 400 }
    );
  }

  // Verify the signature using @polkadot/util-crypto
  try {
    const result = signatureVerify(challenge, validated.signature, validated.address);

    if (!result.isValid) {
      return NextResponse.json(
        { error: "Invalid signature. Please try signing again." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Signature verification failed:", error);
    return NextResponse.json(
      { error: "Signature verification failed. Please try again." },
      { status: 400 }
    );
  }

  // Check if the signer address matches any wallet in the profile
  const walletAddresses = verificationData?.walletAddresses || [];
  const addressMatched = walletAddresses.some((addr: string) =>
    isSameAddress(validated.address!, addr)
  );

  if (!addressMatched) {
    return NextResponse.json(
      {
        error:
          "The signing address does not match any wallet associated with this profile.",
      },
      { status: 403 }
    );
  }

  // Signature valid and address matches -> set as verified
  await database.claimRequest.update({
    where: { id: claim.id },
    data: {
      status: "VERIFIED",
      verificationData: {
        ...verificationData,
        verifiedAddress: validated.address,
        verifiedAt: new Date().toISOString(),
      },
    },
  });

  // Run post-claim processing
  await processVerifiedClaim(claim.id, userId, profileId, "WALLET_SIGNATURE");

  return NextResponse.json({
    status: "VERIFIED",
    message: "Wallet signature verified. Profile claimed successfully!",
  });
}

async function handleEmailVerification(
  claim: any,
  validated: z.infer<typeof verifyClaimSchema>
) {
  if (!validated.token && !validated.code) {
    return NextResponse.json(
      { error: "Verification token or code is required" },
      { status: 400 }
    );
  }

  const verificationData = claim.verificationData as any;
  const storedToken = verificationData?.token;
  const storedCode = verificationData?.code;

  // Check token or code match
  const tokenMatch = validated.token && validated.token === storedToken;
  const codeMatch =
    validated.code &&
    validated.code.toUpperCase() === storedCode?.toUpperCase();

  if (!tokenMatch && !codeMatch) {
    return NextResponse.json(
      { error: "Invalid verification token or code" },
      { status: 400 }
    );
  }

  // Email claims always need admin review (weakest proof)
  await database.claimRequest.update({
    where: { id: claim.id },
    data: {
      status: "PENDING",
      verificationData: {
        ...verificationData,
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
        awaitingAdminReview: true,
      },
    },
  });

  return NextResponse.json({
    status: "PENDING",
    message:
      "Email verified. Your claim is now pending admin review. You will be notified when it is approved.",
  });
}
