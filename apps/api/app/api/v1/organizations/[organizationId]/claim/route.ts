import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { formatZodError } from "@/lib/zod-errors";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for organization claim
const claimOrgSchema = z.object({
  proof: z
    .string()
    .min(10, "Please provide a detailed description of your proof of ownership")
    .max(2000),
});

// POST /api/v1/organizations/{organizationId}/claim - Request to claim an organization
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = await params;
    const body = await request.json();
    const validated = claimOrgSchema.parse(body);
    const userId = session.user.id;

    // Check organization exists
    const organization = await database.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = await database.member.findFirst({
      where: {
        organizationId,
        userId,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this organization" },
        { status: 409 }
      );
    }

    // Organization claims always go to admin queue - never auto-approved
    // We store the claim as a special request in the system
    // For now, we use a simple pattern: create a pending invitation-like record
    // that admins can review

    // Store the claim request in the organization's metadata or a dedicated table
    // Since we don't have an org-specific claim table, we'll log it for admin review
    // For the MVP, we create an invitation with status "claim_pending"
    const existingClaim = await database.invitation.findFirst({
      where: {
        organizationId,
        email: session.user.email,
        status: "claim_pending",
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: "You already have a pending claim for this organization" },
        { status: 409 }
      );
    }

    const claim = await database.invitation.create({
      data: {
        organizationId,
        email: session.user.email,
        role: "owner",
        status: "claim_pending",
        inviterId: userId, // Self-referential for claims
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    console.log(
      `[Org Claim] User ${userId} (${session.user.email}) claimed organization ${organizationId} (${organization.name}). Proof: ${validated.proof}`
    );

    return NextResponse.json({
      claimId: claim.id,
      status: "pending",
      message:
        "Your organization claim has been submitted for admin review. You will be notified when it is processed.",
    });
  } catch (error) {
    console.error("Organization claim error:", error);

    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error);
      return NextResponse.json(formattedError, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to submit organization claim" },
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
