import { database } from "@packages/db";
import { sendSkillMatchBountyEmail } from "@packages/email";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max

// GET /cron/skill-match-notifications - Send skill match notifications for new bounties
export async function GET(request: Request) {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get bounties created in the last 24 hours that have required skills
    const newBounties = await database.bounty.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
        status: "OPEN",
        skills: {
          isEmpty: false,
        },
      },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (newBounties.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No new bounties with skills to match",
      });
    }

    // Get all active users with skills and email preferences enabled
    const activeUsers = await database.user.findMany({
      where: {
        profileCompleted: true,
        skills: {
          isEmpty: false,
        },
        // Check if user has skill match notifications enabled
        preferences: {
          path: ["notifications", "skillMatch"],
          equals: true,
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        skills: true,
        lastSeen: true,
      },
    });

    let emailsSent = 0;
    const errors: string[] = [];

    // Process each user
    for (const user of activeUsers) {
      try {
        // Skip if user hasn't been active in the last 30 days
        if (
          user.lastSeen &&
          user.lastSeen < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        ) {
          continue;
        }

        const userSkills = (user.skills as string[]) || [];
        if (userSkills.length === 0) continue;

        // Find matching bounties for this user
        const matchingBounties = newBounties.filter((bounty) => {
          const bountySkills = (bounty.skills as string[]) || [];
          // Check if user has at least 50% of the required skills
          const matchingSkills = bountySkills.filter((skill) =>
            userSkills.some(
              (userSkill) => userSkill.toLowerCase() === skill.toLowerCase()
            )
          );
          return matchingSkills.length >= Math.ceil(bountySkills.length * 0.5);
        });

        if (matchingBounties.length === 0) continue;

        // Send only the best match (highest prize)
        const bestMatch = matchingBounties.sort((a, b) => {
          const aAmount = Number(a.amount) || 0;
          const bAmount = Number(b.amount) || 0;
          return bAmount - aAmount;
        })[0];

        const bountySkills = (bestMatch.skills as string[]) || [];
        const matchingSkills = bountySkills.filter((skill) =>
          userSkills.some(
            (userSkill) => userSkill.toLowerCase() === skill.toLowerCase()
          )
        );

        await sendSkillMatchBountyEmail(
          {
            email: user.email,
            firstName: user.firstName || undefined,
            username: user.username || undefined,
          },
          {
            id: bestMatch.id,
            title: bestMatch.title,
            description: bestMatch.description || "",
            organization: {
              name: bestMatch.organization.name,
            },
            prizeAmount: `${bestMatch.amount} ${bestMatch.token || "USDT"}`,
            deadline: bestMatch.deadline || new Date(),
            token: bestMatch.token,
          },
          matchingSkills
        );

        emailsSent++;
      } catch (error) {
        console.error(
          `Failed to send skill match email to user ${user.id}:`,
          error
        );
        errors.push(
          `User ${user.id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Skill match notifications completed`,
      stats: {
        bountiesProcessed: newBounties.length,
        usersProcessed: activeUsers.length,
        emailsSent,
        errors: errors.length,
      },
      ...(errors.length > 0 && { errors }),
    });
  } catch (error) {
    console.error("Skill match notifications cron error:", error);
    return NextResponse.json(
      {
        error: "Failed to process skill match notifications",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
