import { database } from "@packages/db";
import { sendSkillMatchBountyEmail } from "@packages/email";
import { NextResponse } from "next/server";
import { validateCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const getRecentSkillMatchBounties = async (now: Date) =>
  database.bounty.findMany({
    where: {
      createdAt: {
        gte: new Date(now.getTime() - ONE_DAY_MS),
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

const getActiveSkillMatchUsers = async () => {
  const activeNotificationSettings =
    await database.notificationSetting.findMany({
      where: {
        channel: "EMAIL",
        type: "NEW_BOUNTY_MATCHING_SKILLS",
        isEnabled: true,
        user: {
          profileCompleted: true,
          skills: {
            isEmpty: false,
          },
        },
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            skills: true,
            lastSeen: true,
          },
        },
      },
    });

  return activeNotificationSettings.map((setting) => setting.user);
};

const getLegacySkillMatchUsers = () =>
  database.user.findMany({
    where: {
      profileCompleted: true,
      skills: {
        isEmpty: false,
      },
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

const getAllActiveSkillMatchUsers = async () => {
  const [notificationSettingUsers, legacyPreferenceUsers] = await Promise.all([
    getActiveSkillMatchUsers(),
    getLegacySkillMatchUsers(),
  ]);

  return Array.from(
    new Map(
      [...notificationSettingUsers, ...legacyPreferenceUsers].map((user) => [
        user.id,
        user,
      ])
    ).values()
  );
};

const findMatchingBounties = (
  userSkills: string[],
  bounties: Awaited<ReturnType<typeof getRecentSkillMatchBounties>>
) =>
  bounties.filter((bounty) => {
    const bountySkills = (bounty.skills as string[]) || [];
    const matchingSkills = bountySkills.filter((skill) =>
      userSkills.some(
        (userSkill) => userSkill.toLowerCase() === skill.toLowerCase()
      )
    );
    return matchingSkills.length >= Math.ceil(bountySkills.length * 0.5);
  });

const getBestBountyMatch = (
  matchingBounties: ReturnType<typeof findMatchingBounties>
) =>
  matchingBounties.sort((a, b) => {
    const aAmount = Number(a.amountUSD) || 0;
    const bAmount = Number(b.amountUSD) || 0;
    return bAmount - aAmount;
  })[0];

const getUserMatchingSkills = (userSkills: string[], bountySkills: string[]) =>
  bountySkills.filter((skill) =>
    userSkills.some(
      (userSkill) => userSkill.toLowerCase() === skill.toLowerCase()
    )
  );

const isInactiveUser = (lastSeen: Date | null, now: Date) =>
  Boolean(lastSeen && lastSeen < new Date(now.getTime() - THIRTY_DAYS_MS));

const sendSkillMatchEmailToUser = async (
  user: Awaited<ReturnType<typeof getAllActiveSkillMatchUsers>>[number],
  newBounties: Awaited<ReturnType<typeof getRecentSkillMatchBounties>>,
  now: Date
) => {
  if (isInactiveUser(user.lastSeen, now)) {
    return false;
  }

  const userSkills = (user.skills as string[]) || [];
  if (userSkills.length === 0) {
    return false;
  }

  const matchingBounties = findMatchingBounties(userSkills, newBounties);
  if (matchingBounties.length === 0) {
    return false;
  }

  const bestMatch = getBestBountyMatch(matchingBounties);
  const bountySkills = (bestMatch.skills as string[]) || [];
  const matchingSkills = getUserMatchingSkills(userSkills, bountySkills);

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

  return true;
};

// GET /cron/skill-match-notifications - Send skill match notifications for new bounties
export async function GET(request: Request) {
  const authError = validateCronAuth(request);
  if (authError) {
    return authError;
  }

  try {
    const now = new Date();
    const newBounties = await getRecentSkillMatchBounties(now);

    if (newBounties.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No new bounties with skills to match",
      });
    }

    const activeUsers = await getAllActiveSkillMatchUsers();

    let emailsSent = 0;
    const errors: string[] = [];

    for (const user of activeUsers) {
      try {
        const sent = await sendSkillMatchEmailToUser(user, newBounties, now);
        if (sent) {
          emailsSent++;
        }
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
      message: "Skill match notifications completed",
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
