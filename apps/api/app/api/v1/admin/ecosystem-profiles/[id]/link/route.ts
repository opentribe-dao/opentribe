import { requireSuperAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { processVerifiedClaim } from "@/lib/claim-processing";
import { formatZodError } from "@/lib/zod-errors";
import { database } from "@packages/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const linkSchema = z.object({
  userId: z.string().min(1),
});

/**
 * Admin: Link an ecosystem profile to a user (bypasses claim flow).
 * Creates a VERIFIED claim record and runs post-claim processing.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { id: profileId } = await params;
    const body = await request.json();
    const validated = linkSchema.parse(body);

    const [profile, user] = await Promise.all([
      database.ecosystemProfile.findUnique({ where: { id: profileId } }),
      database.user.findUnique({ where: { id: validated.userId } }),
    ]);

    if (!profile) {
      return NextResponse.json(
        { error: "Ecosystem profile not found" },
        { status: 404 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (profile.claimedByUserId) {
      return NextResponse.json(
        { error: "Profile is already claimed" },
        { status: 409 }
      );
    }

    // Create a verified claim record
    const claim = await database.claimRequest.create({
      data: {
        ecosystemProfileId: profileId,
        userId: validated.userId,
        method: "ADMIN_LINK",
        status: "VERIFIED",
        verificationData: {
          linkedBy: "admin",
          adminId: admin.id,
        },
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    // Run post-claim processing (links profile, merges data, backfills userId)
    await processVerifiedClaim(
      claim.id,
      validated.userId,
      profileId,
      "ADMIN_LINK"
    );

    const updated = await database.ecosystemProfile.findUnique({
      where: { id: profileId },
      include: {
        claimedBy: { select: { id: true, name: true, username: true } },
        _count: { select: { contributions: true } },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Admin link profile error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to link profile" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
