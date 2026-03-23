import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { sendClaimVerificationEmail } from "@packages/email";
import { formatZodError } from "@/lib/zod-errors";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processVerifiedClaim } from "@/lib/claim-processing";

// Schema for claim initiation
const initiateClaimSchema = z.object({
  method: z.enum(["GITHUB_OAUTH", "WALLET_SIGNATURE", "EMAIL_VERIFICATION"]),
});

// POST /api/v1/ecosystem/profiles/{id}/claim - Initiate a claim
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

    const { id } = await params;
    const body = await request.json();
    const validated = initiateClaimSchema.parse(body);
    const userId = session.user.id;

    // 1. Check profile exists
    const profile = await database.ecosystemProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Ecosystem profile not found" },
        { status: 404 }
      );
    }

    // 2. Check if already claimed by this user
    if (profile.claimedByUserId === userId) {
      return NextResponse.json(
        { error: "You have already claimed this profile" },
        { status: 409 }
      );
    }

    // 3. Check if already claimed by someone else
    if (profile.claimedByUserId) {
      return NextResponse.json(
        { error: "This profile has already been claimed by another user" },
        { status: 409 }
      );
    }

    // 4. Check no pending claim exists for this profile+user combo
    const existingClaim = await database.claimRequest.findUnique({
      where: {
        ecosystemProfileId_userId: {
          ecosystemProfileId: id,
          userId,
        },
      },
    });

    if (existingClaim) {
      if (existingClaim.status === "PENDING") {
        return NextResponse.json(
          {
            error: "You already have a pending claim for this profile",
            claimId: existingClaim.id,
            status: existingClaim.status,
          },
          { status: 409 }
        );
      }
      if (existingClaim.status === "VERIFIED") {
        return NextResponse.json(
          { error: "Your claim has already been verified" },
          { status: 409 }
        );
      }
      // If rejected or expired, delete the old claim so user can try again
      await database.claimRequest.delete({
        where: { id: existingClaim.id },
      });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Handle each verification method
    if (validated.method === "GITHUB_OAUTH") {
      return handleGitHubClaim(userId, id, profile, expiresAt);
    }

    if (validated.method === "WALLET_SIGNATURE") {
      return handleWalletClaim(userId, id, profile, expiresAt);
    }

    if (validated.method === "EMAIL_VERIFICATION") {
      return handleEmailClaim(userId, id, profile, expiresAt);
    }

    return NextResponse.json(
      { error: "Invalid claim method" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Claim initiation error:", error);

    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error);
      return NextResponse.json(formattedError, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to initiate claim" },
      { status: 500 }
    );
  }
}

// GET /api/v1/ecosystem/profiles/{id}/claim - Check claim status
export async function GET(
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

    const { id } = await params;

    const claims = await database.claimRequest.findMany({
      where: {
        ecosystemProfileId: id,
        userId: session.user.id,
      },
      select: {
        id: true,
        method: true,
        status: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ claims });
  } catch (error) {
    console.error("Claim status check error:", error);
    return NextResponse.json(
      { error: "Failed to check claim status" },
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

async function handleGitHubClaim(
  userId: string,
  profileId: string,
  profile: any,
  expiresAt: Date
) {
  // Check if user has a GitHub account linked
  const githubAccount = await database.account.findFirst({
    where: {
      userId,
      providerId: "github",
    },
  });

  if (!githubAccount) {
    return NextResponse.json(
      {
        error: "No GitHub account linked. Please link your GitHub account first.",
        requiresGithubLink: true,
      },
      { status: 400 }
    );
  }

  // Compare GitHub account ID with profile's githubAccountId
  if (profile.githubAccountId && githubAccount.accountId === profile.githubAccountId) {
    // Exact match on GitHub account ID -> auto-verify
    const claim = await database.claimRequest.create({
      data: {
        ecosystemProfileId: profileId,
        userId,
        method: "GITHUB_OAUTH",
        status: "VERIFIED",
        verificationData: {
          matchType: "github_account_id",
          githubAccountId: githubAccount.accountId,
        },
        expiresAt,
      },
    });

    // Run post-claim processing
    await processVerifiedClaim(claim.id, userId, profileId, "GITHUB_OAUTH");

    return NextResponse.json({
      claimId: claim.id,
      status: "VERIFIED",
      message: "GitHub identity verified. Profile claimed successfully!",
    });
  }

  // Check username match (weaker proof)
  // Get the user's GitHub username from their profile
  const user = await database.user.findUnique({
    where: { id: userId },
    select: { github: true },
  });

  if (
    profile.github &&
    user?.github &&
    profile.github.toLowerCase() === user.github.toLowerCase()
  ) {
    // Username match but no accountId match -> pending admin review
    const claim = await database.claimRequest.create({
      data: {
        ecosystemProfileId: profileId,
        userId,
        method: "GITHUB_OAUTH",
        status: "PENDING",
        verificationData: {
          matchType: "github_username",
          githubUsername: user.github,
          note: "Username match only - requires admin review",
        },
        expiresAt,
      },
    });

    return NextResponse.json({
      claimId: claim.id,
      status: "PENDING",
      message:
        "GitHub username matched but could not verify account ID. Your claim is pending admin review.",
    });
  }

  // No match at all
  return NextResponse.json(
    {
      error:
        "Your GitHub account does not match this profile. The profile is associated with a different GitHub account.",
    },
    { status: 403 }
  );
}

async function handleWalletClaim(
  userId: string,
  profileId: string,
  profile: any,
  expiresAt: Date
) {
  if (!profile.walletAddresses || profile.walletAddresses.length === 0) {
    return NextResponse.json(
      { error: "This profile has no wallet addresses on file for verification." },
      { status: 400 }
    );
  }

  // Generate a challenge nonce
  const challenge = generateChallenge(profileId, userId);

  const claim = await database.claimRequest.create({
    data: {
      ecosystemProfileId: profileId,
      userId,
      method: "WALLET_SIGNATURE",
      status: "PENDING",
      verificationData: {
        challenge,
        walletAddresses: profile.walletAddresses,
      },
      expiresAt,
    },
  });

  return NextResponse.json({
    claimId: claim.id,
    status: "PENDING",
    challenge,
    message: "Please sign the challenge message with your Polkadot wallet.",
  });
}

async function handleEmailClaim(
  userId: string,
  profileId: string,
  profile: any,
  expiresAt: Date
) {
  if (!profile.email) {
    return NextResponse.json(
      { error: "This profile has no email address on file for verification." },
      { status: 400 }
    );
  }

  // Generate verification token and code
  const token = generateToken();
  const code = generateVerificationCode();

  const claim = await database.claimRequest.create({
    data: {
      ecosystemProfileId: profileId,
      userId,
      method: "EMAIL_VERIFICATION",
      status: "PENDING",
      verificationData: {
        token,
        code,
        emailSentTo: profile.email,
      },
      expiresAt,
    },
  });

  // Send verification email
  try {
    await sendClaimVerificationEmail(
      profile.email,
      profile.displayName,
      token,
      code
    );
  } catch (error) {
    console.error("Failed to send claim verification email:", error);
    // Clean up the claim if email fails
    await database.claimRequest.delete({ where: { id: claim.id } });
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again." },
      { status: 500 }
    );
  }

  // Mask the email for display
  const maskedEmail = maskEmail(profile.email);

  return NextResponse.json({
    claimId: claim.id,
    status: "PENDING",
    maskedEmail,
    message: `Verification email sent to ${maskedEmail}. Please check your inbox.`,
  });
}

function generateChallenge(profileId: string, userId: string): string {
  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  return `Opentribe Profile Claim\n\nI am claiming ecosystem profile ${profileId} for my Opentribe account.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
}

function generateToken(): string {
  return crypto.randomUUID();
}

function generateVerificationCode(): string {
  // Generate a 6-character alphanumeric code
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  const randomValues = new Uint8Array(6);
  crypto.getRandomValues(randomValues);
  for (const val of randomValues) {
    code += chars[val % chars.length];
  }
  return code;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  const maskedLocal =
    local.length <= 2
      ? `${local[0]}***`
      : `${local[0]}${local[1]}***${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}
