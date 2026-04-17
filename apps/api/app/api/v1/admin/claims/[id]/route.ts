import { requireSuperAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { processVerifiedClaim } from "@/lib/claim-processing";
import { auditLog } from "@/lib/audit-log";
import { formatZodError } from "@/lib/zod-errors";
import { database } from "@packages/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateClaimSchema = z.object({
  status: z.enum(["PENDING", "VERIFIED", "REJECTED", "EXPIRED"]),
  reviewNotes: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { id } = await params;

    const claim = await database.claimRequest.findUnique({
      where: { id },
      include: {
        ecosystemProfile: {
          include: {
            contributions: {
              include: {
                grantApplication: {
                  select: { id: true, title: true, status: true },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            github: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!claim) {
      return NextResponse.json(
        { error: "Claim request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: claim });
  } catch (error) {
    console.error("Admin claim detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch claim" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { id } = await params;
    const body = await request.json();
    const validated = updateClaimSchema.parse(body);

    const claim = await database.claimRequest.findUnique({
      where: { id },
      select: { ecosystemProfileId: true, userId: true },
    });

    if (!claim) {
      return NextResponse.json(
        { error: "Claim request not found" },
        { status: 404 }
      );
    }

    // Use shared claim-processing path for approval
    if (validated.status === "VERIFIED") {
      await database.claimRequest.update({
        where: { id },
        data: {
          status: "VERIFIED",
          reviewNotes: validated.reviewNotes,
          reviewedBy: admin.userId,
        },
      });

      // Run the same post-claim workflow as self-service claims
      await processVerifiedClaim(
        id,
        claim.userId,
        claim.ecosystemProfileId,
        "ADMIN_LINK"
      );

      await auditLog({
        action: "claim.approve",
        actorId: admin.userId,
        targetId: id,
        targetType: "claim",
        metadata: { reviewNotes: validated.reviewNotes },
      });

      const result = await database.claimRequest.findUnique({
        where: { id },
        include: {
          ecosystemProfile: { select: { displayName: true, slug: true } },
          user: { select: { name: true, email: true } },
        },
      });

      return NextResponse.json({ data: result });
    }

    // For rejection or other status changes
    const updatedClaim = await database.claimRequest.update({
      where: { id },
      data: {
        status: validated.status,
        reviewNotes: validated.reviewNotes,
        reviewedBy: admin.userId,
      },
    });

    await auditLog({
      action: validated.status === "REJECTED" ? "claim.reject" : "claim.approve",
      actorId: admin.userId,
      targetId: id,
      targetType: "claim",
      metadata: { status: validated.status, reviewNotes: validated.reviewNotes },
    });

    return NextResponse.json({ data: updatedClaim });
  } catch (error) {
    console.error("Admin claim update error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update claim" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
