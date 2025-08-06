import { database } from '@packages/db';
import { sendWeeklyDigestEmail } from '@packages/email';
import { startOfWeek, subDays } from 'date-fns';

// GET /cron/weekly-digest - Send weekly digest emails to users (runs on Mondays)
export const GET = async () => {
  try {
    console.log('Running weekly digest cron job');
    
    const now = new Date();
    const oneWeekAgo = subDays(now, 7);
    const weekStartDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    
    // Get users who have email notifications enabled for weekly digest
    const users = await database.user.findMany({
      where: {
        profileCompleted: true,
        notificationSettings: {
          some: {
            channel: 'EMAIL',
            type: 'NEW_BOUNTY_MATCHING_SKILLS', // Using this as proxy for digest preference
            isEnabled: true,
          },
        },
      },
      include: {
        skills: true,
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
            updatedAt: 'desc',
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
          status: 'OPEN',
          visibility: 'PUBLISHED',
        },
        include: {
          organization: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      database.grant.findMany({
        where: {
          createdAt: { gte: oneWeekAgo },
          status: 'OPEN',
          visibility: 'PUBLISHED',
        },
        include: {
          organization: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Get platform stats
    const [totalOpportunities, activeBuilders] = await Promise.all([
      database.bounty.count({ where: { status: 'OPEN', visibility: 'PUBLISHED' } }) +
      database.grant.count({ where: { status: 'OPEN', visibility: 'PUBLISHED' } }),
      database.user.count({
        where: {
          lastSeen: { gte: oneWeekAgo },
          profileCompleted: true,
        },
      }),
    ]);

    // Calculate total prize pool (simplified - in production would need proper currency handling)
    const totalPrizePool = await database.bounty.aggregate({
      where: { status: 'OPEN', visibility: 'PUBLISHED' },
      _sum: { amount: true },
    });

    let emailsSent = 0;
    const errors = [];

    // Send digest to each user
    for (const user of users) {
      try {
        // Get user's parsed skills
        const userSkills = typeof user.skills === 'string' 
          ? JSON.parse(user.skills) 
          : user.skills || [];

        // Filter bounties matching user skills (if they have skills)
        const matchingBounties = userSkills.length > 0 
          ? newBounties.filter(bounty => {
              const bountySkills = bounty.skills || [];
              return bountySkills.some(skill => userSkills.includes(skill));
            })
          : newBounties.slice(0, 3); // Just show top 3 if no skills

        // Prepare application updates
        const applicationUpdates = user.applications
          .filter(app => app.status !== 'DRAFT')
          .map(app => ({
            title: app.grant.title,
            status: app.status,
            id: app.id,
          }));

        // Only send if there's content to share
        if (matchingBounties.length === 0 && newGrants.length === 0 && applicationUpdates.length === 0) {
          continue;
        }

        await sendWeeklyDigestEmail(
          {
            email: user.email,
            firstName: user.firstName || undefined,
            username: user.username || undefined,
          },
          {
            weekStartDate: weekStartDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            newBounties: matchingBounties.slice(0, 3).map(b => ({
              id: b.id,
              title: b.title,
              organization: b.organization.name,
              amount: `${b.amount || 0} ${b.token || 'USD'}`,
            })),
            newGrants: newGrants.slice(0, 3).map(g => ({
              id: g.id,
              title: g.title,
              organization: g.organization.name,
              amount: g.maxAmount ? g.maxAmount.toString() : 'Variable',
            })),
            applicationUpdates,
            platformStats: {
              totalOpportunities,
              totalPrizePool: `$${(totalPrizePool._sum.amount || 0).toLocaleString()}`,
              activeBuilders,
            },
          }
        );
        
        emailsSent++;
      } catch (error) {
        console.error(`Failed to send digest to ${user.email}:`, error);
        errors.push({
          userId: user.id,
          email: user.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

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
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Weekly digest cron job failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};