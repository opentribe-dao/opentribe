import { requireSuperAdmin, unauthorizedResponse } from "@/lib/admin-auth";
import { auditLog } from "@/lib/audit-log";
import { formatZodError } from "@/lib/zod-errors";
import { database } from "@packages/db";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const mergeSchema = z.object({
  sourceProfileId: z.string().min(1),
});

/**
 * Merge a source ecosystem profile into the target (id) profile.
 * The target profile keeps its data, and any contributions from the source
 * are moved to the target. The source profile is then deleted.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    if (!admin) return unauthorizedResponse();

    const { id: targetId } = await params;
    const body = await request.json();
    const validated = mergeSchema.parse(body);
    const { sourceProfileId } = validated;

    if (targetId === sourceProfileId) {
      return NextResponse.json(
        { error: "Cannot merge a profile into itself" },
        { status: 400 }
      );
    }

    // Verify both profiles exist
    const [targetProfile, sourceProfile] = await Promise.all([
      database.ecosystemProfile.findUnique({ where: { id: targetId } }),
      database.ecosystemProfile.findUnique({ where: { id: sourceProfileId } }),
    ]);

    if (!targetProfile) {
      return NextResponse.json(
        { error: "Target profile not found" },
        { status: 404 }
      );
    }

    if (!sourceProfile) {
      return NextResponse.json(
        { error: "Source profile not found" },
        { status: 404 }
      );
    }

    // Perform the merge in a transaction
    const result = await database.$transaction(async (tx) => {
      // Move contributions from source to target
      await tx.ecosystemContribution.updateMany({
        where: { ecosystemProfileId: sourceProfileId },
        data: { ecosystemProfileId: targetId },
      });

      // Move curator references from source to target
      await tx.curator.updateMany({
        where: { ecosystemProfileId: sourceProfileId },
        data: { ecosystemProfileId: targetId },
      });

      // Move claim requests from source to target
      await tx.claimRequest.updateMany({
        where: { ecosystemProfileId: sourceProfileId },
        data: { ecosystemProfileId: targetId },
      });

      // Merge fields: fill in any missing data on target from source
      const updateData: Record<string, unknown> = {};

      if (!targetProfile.email && sourceProfile.email) {
        updateData.email = sourceProfile.email;
      }
      if (!targetProfile.github && sourceProfile.github) {
        updateData.github = sourceProfile.github;
      }
      if (!targetProfile.twitter && sourceProfile.twitter) {
        updateData.twitter = sourceProfile.twitter;
      }
      if (!targetProfile.linkedin && sourceProfile.linkedin) {
        updateData.linkedin = sourceProfile.linkedin;
      }
      if (!targetProfile.website && sourceProfile.website) {
        updateData.website = sourceProfile.website;
      }
      if (!targetProfile.telegram && sourceProfile.telegram) {
        updateData.telegram = sourceProfile.telegram;
      }
      if (!targetProfile.bio && sourceProfile.bio) {
        updateData.bio = sourceProfile.bio;
      }
      if (!targetProfile.location && sourceProfile.location) {
        updateData.location = sourceProfile.location;
      }

      // Merge wallet addresses (deduplicate)
      const mergedWallets = [
        ...new Set([
          ...targetProfile.walletAddresses,
          ...sourceProfile.walletAddresses,
        ]),
      ];
      updateData.walletAddresses = mergedWallets;

      // Merge skills (deduplicate)
      const mergedSkills = [
        ...new Set([...targetProfile.skills, ...sourceProfile.skills]),
      ];
      updateData.skills = mergedSkills;

      // If source was claimed but target isn't, inherit claim
      if (!targetProfile.claimedByUserId && sourceProfile.claimedByUserId) {
        updateData.claimedByUserId = sourceProfile.claimedByUserId;
        updateData.claimedAt = sourceProfile.claimedAt;
        updateData.claimMethod = sourceProfile.claimMethod;
      }

      // Update target profile with merged data
      if (Object.keys(updateData).length > 0) {
        await tx.ecosystemProfile.update({
          where: { id: targetId },
          data: updateData,
        });
      }

      // Delete the source profile
      await tx.ecosystemProfile.delete({
        where: { id: sourceProfileId },
      });

      // Return the updated target profile
      return tx.ecosystemProfile.findUnique({
        where: { id: targetId },
        include: {
          _count: {
            select: { contributions: true, claimRequests: true },
          },
        },
      });
    });

    await auditLog({
      action: "profile.merge",
      actorId: admin.userId,
      targetId: targetId,
      targetType: "ecosystem_profile",
      metadata: { sourceProfileId },
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Admin ecosystem profile merge error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(formatZodError(error), { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to merge ecosystem profiles" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
