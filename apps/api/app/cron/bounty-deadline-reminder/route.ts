import { database } from "@packages/db";
import { sendBountyDeadlineReminderEmail } from "@packages/email";
import { addDays } from "date-fns";

// GET /cron/bounty-deadline-reminder - Send reminder emails for bounties ending in 3 days
export const GET = async () => {
  try {
    console.log("Running bounty deadline reminder cron job");

    // Get current date and date 3 days from now
    const now = new Date();
    const threeDaysFromNow = addDays(now, 3);

    // Find bounties with deadlines between now+2.5 days and now+3.5 days
    // This gives us a 1-day window to ensure we catch bounties even if cron timing varies
    const startWindow = addDays(now, 2.5);
    const endWindow = addDays(now, 3.5);

    const bounties = await database.bounty.findMany({
      where: {
        status: "OPEN",
        deadline: {
          gte: startWindow,
          lte: endWindow,
        },
        // Only bounties that haven't had a reminder sent recently
        OR: [
          { lastReminderSentAt: { equals: null } },
          { lastReminderSentAt: { lt: addDays(now, -1) } }, // Haven't sent reminder in last day
        ],
      },
      include: {
        organization: {
          include: {
            members: {
              where: {
                role: { in: ["owner", "admin"] },
              },
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
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    console.log(`Found ${bounties.length} bounties approaching deadline`);

    let emailsSent = 0;
    const errors = [];

    // Send reminder emails for each bounty
    for (const bounty of bounties) {
      if (!bounty.deadline) continue;

      try {
        // Send to each admin/owner
        for (const member of bounty.organization.members) {
          if (member.user) {
            try {
              await sendBountyDeadlineReminderEmail(
                {
                  email: member.user.email,
                  firstName: member.user.firstName || undefined,
                  username: member.user.username || undefined,
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
                `Failed to send reminder to ${member.user.email}:`,
                emailError
              );
              errors.push({
                bountyId: bounty.id,
                email: member.user.email,
                error:
                  emailError instanceof Error
                    ? emailError.message
                    : "Unknown error",
              });
            }
          }
        }

        // Update last reminder sent timestamp
        await database.bounty.update({
          where: { id: bounty.id },
          data: { lastReminderSentAt: now },
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
