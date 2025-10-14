import { database } from "@packages/db";
import { sendBountyWinnerReminderEmail } from "@packages/email";
import { NextResponse } from "next/server";

// GET /cron/bounty-deadline-passed - Update bounties whose deadline has passed to REVIEWING status
export const GET = async () => {
  try {
    console.log("Running bounty deadline passed cron job");

    const now = new Date();

    // Find bounties that:
    // 1. Have OPEN status
    // 2. Have a deadline that has passed
    // 3. Haven't been updated to REVIEWING yet
    const expiredBounties = await database.bounty.findMany({
      where: {
        status: "OPEN",
        deadline: {
          lte: now, // Deadline has passed
        },
        visibility: "PUBLISHED", // Only published bounties
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
      },
    });

    if (expiredBounties.length === 0) {
      console.log("No bounties found with expired deadlines");
      return NextResponse.json({
        success: true,
        message: "No bounties found with expired deadlines",
        updatedBounties: [],
        totalCount: 0,
      });
    }

    console.log(
      `Found ${expiredBounties.length} bounties with expired deadlines`
    );

    // Update bounties to REVIEWING status
    const bountyIds = expiredBounties.map((bounty) => bounty.id);

    const updateResult = await database.bounty.updateMany({
      where: {
        id: {
          in: bountyIds,
        },
      },
      data: {
        status: "REVIEWING",
        updatedAt: now,
      },
    });

    console.log(`Updated ${updateResult.count} bounties to REVIEWING status`);

    // Prepare response data
    const updatedBounties = expiredBounties.map((bounty) => ({
      id: bounty.id,
      title: bounty.title,
      deadline: bounty.deadline,
      submissionCount: bounty.submissionCount,
    }));

    // Send winner reminder emails to bounty curators
    const emailPromises = expiredBounties.map(async (bounty) => {
      // Only send emails if there are submissions
      if (bounty.submissionCount === 0) {
        console.log(`Skipping email for bounty ${bounty.id} - no submissions`);
        return null;
      }

      // Send email only to the bounty curators
      const curatorEmailPromises = bounty.curators.map(async (curator) => {
        try {
          const totalPrize = bounty.amount ? bounty.amount.toString() : "0";

          await sendBountyWinnerReminderEmail(
            {
              email: curator.user.email,
              firstName: curator.user.firstName || undefined,
              username: curator.user.username || undefined,
            },
            {
              id: bounty.id,
              title: bounty.title,
              deadline: bounty.deadline!,
              submissionCount: bounty.submissionCount,
              totalPrize,
              token: bounty.token,
            }
          );

          console.log(
            `Sent winner reminder email for bounty ${bounty.id} to ${curator.user.email}`
          );
        } catch (error) {
          console.error(
            `Failed to send email for bounty ${bounty.id} to ${curator.user.email}:`,
            error
          );
        }
      });

      return Promise.allSettled(curatorEmailPromises);
    });

    // Wait for all emails to be sent (or fail)
    await Promise.allSettled(emailPromises);

    // Update lastWinnerReminderSentAt for bounties that had emails sent
    const bountiesWithSubmissions = expiredBounties.filter(
      (bounty) => bounty.submissionCount > 0
    );

    if (bountiesWithSubmissions.length > 0) {
      await database.bounty.updateMany({
        where: {
          id: {
            in: bountiesWithSubmissions.map((bounty) => bounty.id),
          },
        },
        data: {
          lastWinnerReminderSentAt: now,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updateResult.count} bounties to REVIEWING status`,
      updatedBounties,
      totalCount: updateResult.count,
      emailsSent: bountiesWithSubmissions.length,
    });
  } catch (error) {
    console.error("Error in bounty deadline pass cron job:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process bounty deadline pass cron job",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

// Handle unsupported methods
export const POST = () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};

export const PUT = () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};

export const DELETE = () => {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
};
