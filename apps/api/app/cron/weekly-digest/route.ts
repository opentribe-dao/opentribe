import { database } from "@packages/db";
import { sendWeeklyDigestEmail } from "@packages/email";
import { startOfWeek, subDays } from "date-fns";
import { validateCronAuth } from "@/lib/cron-auth";

const WEEKLY_DIGEST_EMAIL_CONCURRENCY = 5;

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
) {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, Math.max(items.length, 1)) },
      () => runWorker()
    )
  );

  return results;
}

// GET /cron/weekly-digest - Send weekly digest emails to users (runs on Mondays)
export const GET = async (request: Request) => {
  // Validate cron authentication
  const authError = validateCronAuth(request);
  if (authError) {
    return authError;
  }

  try {
    console.log("Running weekly digest cron job");

    const now = new Date();
    const oneWeekAgo = subDays(now, 7);
    const weekStartDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday

    // Get users who have email notifications enabled for weekly digest
    const users = await database.user.findMany({
      where: {
        profileCompleted: true,
        notificationSettings: {
          some: {
            channel: "EMAIL",
            type: "WEEKLY_DIGEST",
            isEnabled: true,
          },
        },
      },
      include: {
        // skills: true,
        applications: {
          where: {
            updatedAt: {
              gte: oneWeekAgo,
            },
          },
          include: {
            grant: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 5,
        },
      },
    });

    console.log(`Found ${users.length} users to send digest to`);

    // Get new opportunities from the past week
    const [newBounties, newGrants] = await Promise.all([
      database.bounty.findMany({
        where: {
          createdAt: { gte: oneWeekAgo },
          status: "OPEN",
          visibility: "PUBLISHED",
        },
        include: {
          organization: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      database.grant.findMany({
        where: {
          createdAt: { gte: oneWeekAgo },
          status: "OPEN",
          visibility: "PUBLISHED",
        },
        include: {
          organization: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // Get platform stats
    const [totalOpportunities, activeBuilders] = await Promise.all([
      (await database.bounty.count({
        where: { status: "OPEN", visibility: "PUBLISHED" },
      })) +
        (await database.grant.count({
          where: { status: "OPEN", visibility: "PUBLISHED" },
        })),
      await database.user.count({
        where: {
          lastSeen: { gte: oneWeekAgo },
          profileCompleted: true,
        },
      }),
    ]);

    const [bountyAgg, grantsAgg] = await Promise.all([
      database.bounty.aggregate({
        _sum: { amountUSD: true },
        where: {
          winnersAnnouncedAt: { not: null },
          visibility: "PUBLISHED",
          status: { in: ["OPEN", "COMPLETED", "REVIEWING"] },
        },
      }),
      database.grant.aggregate({
        _sum: { totalFundsUSD: true },
        where: { visibility: "PUBLISHED", status: "OPEN" },
      }),
    ]);

    const totalPrizePool =
      Number(bountyAgg?._sum?.amountUSD ?? 0) +
      Number(grantsAgg?._sum?.totalFundsUSD ?? 0);

    const emailResults = await mapWithConcurrency(
      users,
      WEEKLY_DIGEST_EMAIL_CONCURRENCY,
      async (user) => {
        try {
          const userSkills =
            typeof user.skills === "string"
              ? JSON.parse(user.skills)
              : user.skills || [];

          const matchingBounties =
            userSkills.length > 0
              ? newBounties.filter((bounty) => {
                  const bountySkills = bounty.skills || [];
                  return bountySkills.some((skill) =>
                    userSkills.includes(skill)
                  );
                })
              : newBounties.slice(0, 3);

          const applicationUpdates = user.applications
            .filter((app) => app.status !== "DRAFT")
            .map((app) => ({
              title: app.grant.title,
              status: app.status,
              id: app.id,
            }));

          if (
            matchingBounties.length === 0 &&
            newGrants.length === 0 &&
            applicationUpdates.length === 0
          ) {
            return { skipped: true };
          }

          await sendWeeklyDigestEmail(
            {
              email: user.email,
              firstName: user.firstName || undefined,
              username: user.username || undefined,
            },
            {
              weekStartDate: weekStartDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              newBounties: matchingBounties.slice(0, 3).map((b) => ({
                id: b.id,
                title: b.title,
                organization: b.organization.name,
                amount: `${b.amount || 0} ${b.token || "USD"}`,
              })),
              newGrants: newGrants.slice(0, 3).map((g) => ({
                id: g.id,
                title: g.title,
                organization: g.organization.name,
                amount: g.maxAmount ? g.maxAmount.toString() : "Variable",
              })),
              applicationUpdates,
              platformStats: {
                totalOpportunities,
                totalPrizePool: totalPrizePool.toLocaleString(),
                activeBuilders,
              },
            }
          );

          return { skipped: false as const };
        } catch (error) {
          return {
            skipped: false as const,
            error,
            user,
          };
        }
      }
    );

    let emailsSent = 0;
    const errors: Array<{
      userId: string;
      email: string;
      error: string;
    }> = [];

    emailResults.forEach((result, index) => {
      const user = users[index];

      if (result.skipped) {
        return;
      }

      if (!("error" in result)) {
        emailsSent++;
        return;
      }

      console.error(`Failed to send digest to ${user.email}:`, result.error);
      errors.push({
        userId: user.id,
        email: user.email,
        error:
          result.error instanceof Error
            ? result.error.message
            : "Unknown error",
      });
    });

    console.log(`Weekly digest job completed. Emails sent: ${emailsSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        usersProcessed: users.length,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Weekly digest cron job failed:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
