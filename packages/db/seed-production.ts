import { database as prisma } from './index';
import {
  productionSeedGrants,
  productionSeedOrganization,
  productionSeedRfps,
} from './production-seed-data';
import { assertSeedEnvironment } from './seed-config';

async function main() {
  assertSeedEnvironment(process.env, 'seed-production.ts');

  console.log('🌱 Starting production-style database seed...');

  const now = new Date();
  const daysFromNow = (days: number): Date => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date;
  };

  await prisma.$transaction([
    prisma.submission.deleteMany(),
    prisma.grantApplication.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.like.deleteMany(),
    prisma.vote.deleteMany(),
    prisma.rFP.deleteMany(),
    prisma.bounty.deleteMany(),
    prisma.grant.deleteMany(),
    prisma.curator.deleteMany(),
    prisma.notificationSetting.deleteMany(),
    prisma.member.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.invitation.deleteMany(),
  ]);

  const owner = await prisma.user.findUniqueOrThrow({
    where: { email: 'david.w3f@example.com' },
  });

  const organization = await prisma.organization.create({
    data: {
      ...productionSeedOrganization,
      members: {
        create: {
          userId: owner.id,
          role: 'owner',
        },
      },
    },
  });

  const grants = await Promise.all(
    productionSeedGrants.map((grant) =>
      prisma.grant.create({
        data: {
          title: grant.title,
          slug: grant.slug,
          summary: grant.summary,
          description: grant.description,
          instructions: grant.instructions,
          resources: [...grant.resources],
          skills: [...grant.skills],
          token: grant.token,
          status: grant.status,
          visibility: grant.visibility,
          source: grant.source,
          applicationUrl: grant.applicationUrl,
          organizationId: organization.id,
          publishedAt: daysFromNow(grant.publishedOffsetDays),
        },
      })
    )
  );

  const grantsBySlug = new Map(grants.map((grant) => [grant.slug, grant]));

  const rfps = await Promise.all(
    productionSeedRfps.map((rfp) =>
      prisma.rFP.create({
        data: {
          title: rfp.title,
          slug: rfp.slug,
          description: rfp.description,
          resources: [...rfp.resources],
          grantId: grantsBySlug.get(rfp.grantSlug)?.id ?? '',
          status: rfp.status,
          visibility: rfp.visibility,
          publishedAt: daysFromNow(rfp.publishedOffsetDays),
        },
      })
    )
  );

  console.log(`✅ Created 1 organization`);
  console.log(`✅ Created ${grants.length} grants`);
  console.log(`✅ Created ${rfps.length} RFP`);
  console.log('✅ Created 0 bounties');
  console.log('🎉 Production-style database seeded successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Production-style seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

