import { database } from "@packages/db";
import { sendBountyWinnerReminderEmail } from "@packages/email";
import { addDays } from "date-fns";
import { validateCronAuth } from "@/lib/cron-auth";

interface WinnerReminderError {
  bountyId: string;
  email?: string;
  error: string;
}

const getWinnerAnnouncementCandidates = (now: Date) => {
  const sevenDaysAgo = addDays(now, -7);

  return database.bounty.findMany({
    where: {
      status: "OPEN",
      deadline: {
        lte: sevenDaysAgo,
      },
      winnersAnnouncedAt: null,
      OR: [
        { lastWinnerReminderSentAt: { equals: null } },
        { lastWinnerReminderSentAt: { lt: addDays(now, -3) } },
      ],
    },
    include: {
      curators: {
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              username: true,
            },
          },
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });
};

const createWinnerReminderError = (
  bountyId: string,
  error: unknown,
  email?: string
): WinnerReminderError => ({
  bountyId,
  ...(email ? { email } : {}),
  error: error instanceof Error ? error.message : "Unknown error",
});

const sendWinnerAnnouncementEmails = async (
  bounty: Awaited<ReturnType<typeof getWinnerAnnouncementCandidates>>[number]
) => {
  let emailsSent = 0;
  const errors: WinnerReminderError[] = [];

  for (const curator of bounty.curators) {
    if (!curator.user) {
      continue;
    }

    try {
      await sendBountyWinnerReminderEmail(
        {
          email: curator.user.email,
          firstName: curator.user.firstName || undefined,
          username: curator.user.username || undefined,
        },
        {
          id: bounty.id,
          title: bounty.title,
          deadline: bounty.deadline as Date,
          submissionCount: bounty._count.submissions,
          totalPrize: bounty.amount?.toString() || "0",
          token: bounty.token || "USD",
        }
      );
      emailsSent++;
    } catch (emailError) {
      console.error(
        `Failed to send reminder to ${curator.user.email}:`,
        emailError
      );
      errors.push(
        createWinnerReminderError(bounty.id, emailError, curator.user.email)
      );
    }
  }

  return { emailsSent, errors };
};

const processWinnerAnnouncementReminder = async (
  bounty: Awaited<ReturnType<typeof getWinnerAnnouncementCandidates>>[number],
  now: Date
) => {
  if (!bounty.deadline) {
    return { emailsSent: 0, errors: [] as WinnerReminderError[] };
  }

  const result = await sendWinnerAnnouncementEmails(bounty);

  await database.bounty.update({
    where: { id: bounty.id },
    data: { lastWinnerReminderSentAt: now },
  });

  return result;
};

// GET /cron/winner-announcement-reminder - Remind orgs to announce winners 7 days after deadline
export const GET = async (request: Request) => {
  const authError = validateCronAuth(request);
  if (authError) {
    return authError;
  }

  try {
    console.log("Running winner announcement reminder cron job");

    const now = new Date();
    const bounties = await getWinnerAnnouncementCandidates(now);

    const bountiesWithSubmissions = bounties.filter(
      (b) => b._count.submissions > 0
    );

    console.log(
      `Found ${bountiesWithSubmissions.length} bounties needing winner announcements`
    );

    let emailsSent = 0;
    const errors: WinnerReminderError[] = [];

    for (const bounty of bountiesWithSubmissions) {
      try {
        const result = await processWinnerAnnouncementReminder(bounty, now);
        emailsSent += result.emailsSent;
        errors.push(...result.errors);
      } catch (error) {
        console.error(`Error processing bounty ${bounty.id}:`, error);
        errors.push(createWinnerReminderError(bounty.id, error));
      }
    }

    console.log(
      `Winner announcement reminder job completed. Emails sent: ${emailsSent}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        bountiesProcessed: bountiesWithSubmissions.length,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Winner announcement reminder cron job failed:", error);
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
