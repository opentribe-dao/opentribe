import { database } from "@packages/db";
import { sendBountyWinnerReminderEmail } from "@packages/email";
import { addDays } from "date-fns";

// GET /cron/winner-announcement-reminder - Remind orgs to announce winners 7 days after deadline
export const GET = async () => {
  try {
    console.log("Running winner announcement reminder cron job");

    const now = new Date();
    const sevenDaysAgo = addDays(now, -7);

    // Find bounties that:
    // 1. Have passed their deadline by 7+ days
    // 2. Haven't announced winners yet
    // 3. Have submissions to review
    const bounties = await database.bounty.findMany({
      where: {
        status: "OPEN",
        deadline: {
          lte: sevenDaysAgo,
        },
        winnersAnnouncedAt: null,
        // Only bounties that haven't had a winner reminder sent recently
        OR: [
          { lastWinnerReminderSentAt: { equals: null } },
          { lastWinnerReminderSentAt: { lt: addDays(now, -3) } }, // Haven't sent reminder in last 3 days
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

    // Filter out bounties with no submissions
    const bountiesWithSubmissions = bounties.filter(
      (b) => b._count.submissions > 0
    );

    console.log(
      `Found ${bountiesWithSubmissions.length} bounties needing winner announcements`
    );

    let emailsSent = 0;
    const errors = [];

    // Send reminder emails for each bounty
    for (const bounty of bountiesWithSubmissions) {
      if (!bounty.deadline) continue;

      try {
        // Send only to the bounty curators
        for (const curator of bounty.curators) {
          if (curator.user) {
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
                  deadline: bounty.deadline,
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
              errors.push({
                bountyId: bounty.id,
                email: curator.user.email,
                error:
                  emailError instanceof Error
                    ? emailError.message
                    : "Unknown error",
              });
            }
          }
        }

        // Update last winner reminder sent timestamp
        await database.bounty.update({
          where: { id: bounty.id },
          data: { lastWinnerReminderSentAt: now },
        });
      } catch (error) {
        console.error(`Error processing bounty ${bounty.id}:`, error);
        errors.push({
          bountyId: bounty.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
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
