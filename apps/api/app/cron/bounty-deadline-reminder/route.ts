import { database } from "@packages/db";
import { sendBountyDeadlineReminderEmail } from "@packages/email";
import { addDays } from "date-fns";
import { validateCronAuth } from "@/lib/cron-auth";

interface ReminderError {
  bountyId: string;
  email?: string;
  error: string;
}

const getReminderWindow = (now: Date) => ({
  startWindow: addDays(now, 2.5),
  endWindow: addDays(now, 3.5),
  lastReminderCutoff: addDays(now, -1),
});

const getBountiesApproachingDeadline = (now: Date) => {
  const { startWindow, endWindow, lastReminderCutoff } = getReminderWindow(now);

  return database.bounty.findMany({
    where: {
      status: "OPEN",
      deadline: {
        gte: startWindow,
        lte: endWindow,
      },
      OR: [
        { lastReminderSentAt: { equals: null } },
        { lastReminderSentAt: { lt: lastReminderCutoff } },
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

const createReminderError = (
  bountyId: string,
  error: unknown,
  email?: string
): ReminderError => ({
  bountyId,
  ...(email ? { email } : {}),
  error: error instanceof Error ? error.message : "Unknown error",
});

const sendCuratorReminderEmails = async (
  bounty: Awaited<ReturnType<typeof getBountiesApproachingDeadline>>[number]
) => {
  let emailsSent = 0;
  const errors: ReminderError[] = [];

  for (const curator of bounty.curators) {
    if (!curator.user) {
      continue;
    }

    try {
      await sendBountyDeadlineReminderEmail(
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
        createReminderError(bounty.id, emailError, curator.user.email)
      );
    }
  }

  return { emailsSent, errors };
};

const processBountyReminder = async (
  bounty: Awaited<ReturnType<typeof getBountiesApproachingDeadline>>[number],
  now: Date
) => {
  if (!bounty.deadline) {
    return { emailsSent: 0, errors: [] as ReminderError[] };
  }

  const { emailsSent, errors } = await sendCuratorReminderEmails(bounty);

  await database.bounty.update({
    where: { id: bounty.id },
    data: { lastReminderSentAt: now },
  });

  return { emailsSent, errors };
};

// GET /cron/bounty-deadline-reminder - Send reminder emails for bounties ending in 3 days
export const GET = async (request: Request) => {
  const authError = validateCronAuth(request);
  if (authError) {
    return authError;
  }

  try {
    console.log("Running bounty deadline reminder cron job");

    // Get current date and date 3 days from now
    const now = new Date();
    const bounties = await getBountiesApproachingDeadline(now);

    console.log(`Found ${bounties.length} bounties approaching deadline`);

    let emailsSent = 0;
    const errors: ReminderError[] = [];

    for (const bounty of bounties) {
      try {
        const result = await processBountyReminder(bounty, now);
        emailsSent += result.emailsSent;
        errors.push(...result.errors);
      } catch (error) {
        console.error(`Error processing bounty ${bounty.id}:`, error);
        errors.push(createReminderError(bounty.id, error));
      }
    }

    console.log(
      `Bounty deadline reminder job completed. Emails sent: ${emailsSent}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        bountiesProcessed: bounties.length,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Bounty deadline reminder cron job failed:", error);
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
