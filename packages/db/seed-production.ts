import { pathToFileURL } from "node:url";
import { database as prismaClient } from "./index";
import {
  productionSeedGrants,
  productionSeedOrganization,
  productionSeedRfps,
} from "./production-seed-data";

/**
 * Production-safe Kusama content upsert
 *
 * Purpose:
 * - preserve existing production marketplace data
 * - create/update only the Web3 Foundation Kusama records
 *
 * Required in production:
 * - ALLOW_PRODUCTION_SEED_UPSERT=true
 *
 * Optional:
 * - SEED_PRODUCTION_OWNER_EMAIL=<existing user email>
 *   defaults to david.w3f@example.com
 */

type Logger = {
  log: (message: string) => void;
  error: (message: string, error?: unknown) => void;
  warn: (message: string) => void;
};

type SeedDb = {
  user: {
    findUnique: (args: {
      where: { email: string };
    }) => Promise<{ id: string } | null>;
  };
  organization: {
    upsert: (args: {
      where: { slug: string };
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    }) => Promise<{ id: string; slug: string }>;
  };
  member: {
    upsert: (args: {
      where: {
        organizationId_userId: { organizationId: string; userId: string };
      };
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    }) => Promise<unknown>;
  };
  grant: {
    upsert: (args: {
      where: { slug: string };
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    }) => Promise<{ id: string; slug: string }>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<unknown>;
  };
  rFP: {
    upsert: (args: {
      where: { slug: string };
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    }) => Promise<{ id: string; slug: string }>;
  };
  $disconnect: () => Promise<void>;
};

const defaultLogger: Logger = {
  log: (message) => console.log(message),
  error: (message, error) => console.error(message, error),
  warn: (message) => console.warn(message),
};

export const assertProductionSeedPermission = (
  env: NodeJS.ProcessEnv = process.env
) => {
  if (
    env.NODE_ENV === "production" &&
    env.ALLOW_PRODUCTION_SEED_UPSERT !== "true"
  ) {
    throw new Error(
      "seed-production.ts requires ALLOW_PRODUCTION_SEED_UPSERT=true in production"
    );
  }
};

export const runProductionSeed = async ({
  db = prismaClient as unknown as SeedDb,
  now = new Date(),
  logger = defaultLogger,
  ownerEmail = "david.w3f@example.com",
}: {
  db?: SeedDb;
  now?: Date;
  logger?: Logger;
  ownerEmail?: string;
} = {}) => {
  const daysFromNow = (days: number): Date => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date;
  };

  logger.log("🌱 Starting production-safe Kusama upsert...");

  const owner = await db.user.findUnique({
    where: { email: ownerEmail },
  });

  const organization = await db.organization.upsert({
    where: { slug: productionSeedOrganization.slug },
    update: {
      name: productionSeedOrganization.name,
      headline: productionSeedOrganization.headline,
      description: productionSeedOrganization.description,
      logo: productionSeedOrganization.logo,
      twitter: productionSeedOrganization.twitter,
      github: productionSeedOrganization.github,
      websiteUrl: productionSeedOrganization.websiteUrl,
      location: productionSeedOrganization.location,
      isVerified: productionSeedOrganization.isVerified,
      visibility: productionSeedOrganization.visibility,
    },
    create: {
      ...productionSeedOrganization,
    },
  });

  if (owner) {
    await db.member.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: owner.id,
        },
      },
      update: {
        role: "owner",
      },
      create: {
        organizationId: organization.id,
        userId: owner.id,
        role: "owner",
      },
    });
  } else {
    logger.warn(
      `Skipping owner membership upsert because seed owner ${ownerEmail} was not found`
    );
  }

  const grants = await Promise.all(
    productionSeedGrants.map((grant) =>
      db.grant.upsert({
        where: { slug: grant.slug },
        update: {
          title: grant.title,
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
        },
        create: {
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
    productionSeedRfps.map((rfp) => {
      const grant = grantsBySlug.get(rfp.grantSlug);

      if (!grant) {
        throw new Error(`Missing grant ${rfp.grantSlug} for RFP ${rfp.slug}`);
      }

      return db.rFP.upsert({
        where: { slug: rfp.slug },
        update: {
          title: rfp.title,
          description: rfp.description,
          resources: [...rfp.resources],
          grantId: grant.id,
          status: rfp.status,
          visibility: rfp.visibility,
        },
        create: {
          title: rfp.title,
          slug: rfp.slug,
          description: rfp.description,
          resources: [...rfp.resources],
          grantId: grant.id,
          status: rfp.status,
          visibility: rfp.visibility,
          publishedAt: daysFromNow(rfp.publishedOffsetDays),
        },
      });
    })
  );

  // Sync rfpCount on each grant to match actual linked RFPs
  const rfpCountByGrantId = new Map<string, number>();
  for (const rfp of rfps) {
    const seedRfp = productionSeedRfps.find((r) => r.slug === rfp.slug);
    if (!seedRfp) {
      continue;
    }
    const grant = grantsBySlug.get(seedRfp.grantSlug);
    if (!grant) {
      continue;
    }
    rfpCountByGrantId.set(grant.id, (rfpCountByGrantId.get(grant.id) ?? 0) + 1);
  }

  for (const grant of grants) {
    const count = rfpCountByGrantId.get(grant.id) ?? 0;
    await db.grant.update({
      where: { id: grant.id },
      data: { rfpCount: count },
    });
  }

  logger.log(`✅ Upserted 1 organization`);
  logger.log(`✅ Upserted ${grants.length} grants`);
  logger.log(`✅ Upserted ${rfps.length} RFP`);
  logger.log("✅ Preserved unrelated production data");
  logger.log("🎉 Production-safe Kusama upsert completed successfully!");
};

const main = async () => {
  assertProductionSeedPermission(process.env);
  await runProductionSeed({
    ownerEmail:
      process.env.SEED_PRODUCTION_OWNER_EMAIL || "david.w3f@example.com",
  });
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main()
    .catch((error) => {
      defaultLogger.error("❌ Production-safe Kusama upsert failed:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prismaClient.$disconnect();
    });
}
