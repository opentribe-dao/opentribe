import { database } from "@packages/db";
import type { ClaimMethod } from "@packages/db";

/**
 * Process a verified claim by linking the ecosystem profile to the user.
 * This runs as a transaction to ensure consistency.
 *
 * Steps:
 * 1. Set EcosystemProfile.claimedByUserId, claimedAt, claimMethod
 * 2. Update outreachStatus if it was set
 * 3. Merge profile data into User (non-destructive)
 * 4. Backfill userId on GrantApplications linked through EcosystemContributions
 */
export async function processVerifiedClaim(
  claimId: string,
  userId: string,
  profileId: string,
  method: ClaimMethod
): Promise<void> {
  await database.$transaction(async (tx) => {
    // 1. Get the ecosystem profile
    const profile = await tx.ecosystemProfile.findUnique({
      where: { id: profileId },
      include: {
        contributions: {
          where: {
            role: "APPLICANT",
            grantApplicationId: { not: null },
          },
          include: {
            grantApplication: {
              select: {
                id: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new Error(`Ecosystem profile ${profileId} not found`);
    }

    // 2. Update the ecosystem profile - mark as claimed
    await tx.ecosystemProfile.update({
      where: { id: profileId },
      data: {
        claimedByUserId: userId,
        claimedAt: new Date(),
        claimMethod: method,
        // Update outreach status if it was set
        ...(profile.outreachStatus ? { outreachStatus: "CLAIMED" } : {}),
      },
    });

    // 3. Get current user to merge data non-destructively
    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Build the update data - only fill in fields that are currently empty
    const userUpdate: Record<string, any> = {};

    if (!user.github && profile.github) {
      userUpdate.github = profile.github;
    }
    if (!user.twitter && profile.twitter) {
      userUpdate.twitter = profile.twitter;
    }
    if (!user.linkedin && profile.linkedin) {
      userUpdate.linkedin = profile.linkedin;
    }
    if (!user.website && profile.website) {
      userUpdate.website = profile.website;
    }
    if (!user.telegram && profile.telegram) {
      userUpdate.telegram = profile.telegram;
    }
    if (!user.bio && profile.bio) {
      userUpdate.bio = profile.bio;
    }
    if (!user.location && profile.location) {
      userUpdate.location = profile.location;
    }
    if (
      (!user.skills || user.skills.length === 0) &&
      profile.skills &&
      profile.skills.length > 0
    ) {
      userUpdate.skills = profile.skills;
    }

    // Update user if there are fields to merge
    if (Object.keys(userUpdate).length > 0) {
      await tx.user.update({
        where: { id: userId },
        data: userUpdate,
      });
    }

    // 4. Backfill userId on GrantApplications
    for (const contribution of profile.contributions) {
      if (!contribution.grantApplication) continue;

      const app = contribution.grantApplication;

      if (app.userId === null) {
        // No user assigned - backfill
        await tx.grantApplication.update({
          where: { id: app.id },
          data: { userId },
        });
      } else if (app.userId !== userId) {
        // Already assigned to someone else - log for admin review
        console.warn(
          `[Claim Processing] GrantApplication ${app.id} already assigned to user ${app.userId}, ` +
            `cannot backfill with claiming user ${userId}. Flagging for admin review.`
        );
      }
      // If app.userId === userId, nothing to do
    }
  });
}
