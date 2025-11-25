import { database as prisma } from "../index";

async function migrateSubmissionStatus() {
  console.log("🔄 Starting submission status migration...");

  try {
    // Use raw SQL to check counts (since Prisma client doesn't recognize old enum values)
    const approvedResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count FROM submission WHERE status = 'APPROVED'
    `;
    const rejectedResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count FROM submission WHERE status = 'REJECTED'
    `;

    const approvedCount = Number(approvedResult[0]?.count || 0);
    const rejectedCount = Number(rejectedResult[0]?.count || 0);

    console.log(`Found ${approvedCount} submissions with APPROVED status`);
    console.log(`Found ${rejectedCount} submissions with REJECTED status`);

    if (approvedCount === 0 && rejectedCount === 0) {
      console.log("✅ No migrations needed - no submissions with old status values");
      return;
    }

    // Migrate APPROVED submissions to SUBMITTED using raw SQL
    if (approvedCount > 0) {
      console.log("Migrating APPROVED submissions to SUBMITTED...");
      const result = await prisma.$executeRaw`
        UPDATE submission 
        SET status = 'SUBMITTED' 
        WHERE status = 'APPROVED'
      `;
      console.log(`✅ Updated ${result} APPROVED submissions to SUBMITTED`);
    }

    // Migrate REJECTED submissions to SPAM using raw SQL
    if (rejectedCount > 0) {
      console.log("Migrating REJECTED submissions to SPAM...");
      const result = await prisma.$executeRaw`
        UPDATE submission 
        SET status = 'SPAM' 
        WHERE status = 'REJECTED'
      `;
      console.log(`✅ Updated ${result} REJECTED submissions to SPAM`);
    }

    // Verify migration using raw SQL
    const remainingApprovedResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count FROM submission WHERE status = 'APPROVED'
    `;
    const remainingRejectedResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count FROM submission WHERE status = 'REJECTED'
    `;

    const remainingApproved = Number(remainingApprovedResult[0]?.count || 0);
    const remainingRejected = Number(remainingRejectedResult[0]?.count || 0);

    if (remainingApproved === 0 && remainingRejected === 0) {
      console.log("✅ Migration completed successfully!");
    } else {
      console.error(
        `⚠️  Warning: Still found ${remainingApproved} APPROVED and ${remainingRejected} REJECTED submissions`
      );
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateSubmissionStatus()
  .then(() => {
    console.log("Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });

