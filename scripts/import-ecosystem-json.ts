/**
 * Import ecosystem data from a JSON export file into the database.
 * Use this to seed staging/prod from locally curated data.
 *
 * Usage:
 *   pnpm tsx scripts/import-ecosystem-json.ts
 *   pnpm tsx scripts/import-ecosystem-json.ts --input data/ecosystem-export.json
 *   pnpm tsx scripts/import-ecosystem-json.ts --input data/ecosystem-export.json --dry-run
 *   pnpm tsx scripts/import-ecosystem-json.ts --input data/ecosystem-export.json --clean
 */

import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { database } from "./lib/db";

const { values: args } = parseArgs({
  options: {
    input: { type: "string", default: "data/ecosystem-export.json" },
    "dry-run": { type: "boolean", default: false },
    clean: { type: "boolean", default: false }, // Wipe existing imported data first
    verbose: { type: "boolean", default: false },
  },
});

const inputPath = args.input!;
const dryRun = args["dry-run"] ?? false;
const clean = args.clean ?? false;
const verbose = args.verbose ?? false;

async function main() {
  console.log("Importing ecosystem data from JSON...");
  console.log(`  Input: ${inputPath}`);
  console.log(`  Dry run: ${dryRun}`);
  console.log(`  Clean first: ${clean}`);
  console.log();

  const raw = readFileSync(inputPath, "utf-8");
  const exportData = JSON.parse(raw);

  console.log(`Export from: ${exportData.exportedAt}`);
  console.log(`Counts:`, exportData.counts);
  console.log();

  if (dryRun) {
    console.log("Dry run — no changes made.");
    await database.$disconnect();
    return;
  }

  const {
    organizations,
    grants,
    applications,
    profiles,
    contributions,
    milestones,
    curators,
  } = exportData.data;

  // Clean existing imported data if requested
  if (clean) {
    console.log("Cleaning existing data...");
    await database.ecosystemContribution.deleteMany();
    await database.grantMilestone.deleteMany();
    await database.claimRequest.deleteMany();
    await database.ecosystemProfile.deleteMany();
    await database.grantApplication.deleteMany({
      where: { externalId: { not: null } },
    });
    await database.importJob.deleteMany();
    console.log("  Cleaned.\n");
  }

  // 1. Organizations
  console.log(`Importing ${organizations.length} organizations...`);
  for (const org of organizations) {
    const { id, createdAt, updatedAt, ...data } = org;
    await database.organization.upsert({
      where: { slug: data.slug },
      update: {
        ...data,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      },
      create: {
        ...data,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      },
    });
  }

  // 2. Grants
  console.log(`Importing ${grants.length} grants...`);
  for (const grant of grants) {
    const { id, createdAt, updatedAt, ...data } = grant;
    // Need to map to existing org
    const org = organizations.find((o: any) => o.id === data.organizationId);
    if (!org) continue;
    const existingOrg = await database.organization.findUnique({
      where: { slug: org.slug },
    });
    if (!existingOrg) continue;

    await database.grant.upsert({
      where: { externalId: data.externalId ?? `import:${data.slug}` },
      update: {
        ...data,
        organizationId: existingOrg.id,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      },
      create: {
        ...data,
        organizationId: existingOrg.id,
        externalId: data.externalId ?? `import:${data.slug}`,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
      },
    });
  }

  // Build ID maps for foreign key resolution
  const grantIdMap = new Map<string, string>();
  for (const grant of grants) {
    const existing = await database.grant.findFirst({
      where: { externalId: grant.externalId ?? `import:${grant.slug}` },
      select: { id: true },
    });
    if (existing) grantIdMap.set(grant.id, existing.id);
  }

  // 3. Grant Applications
  console.log(`Importing ${applications.length} applications...`);
  const appIdMap = new Map<string, string>();
  for (const app of applications) {
    const { id, createdAt, updatedAt, ...data } = app;
    const newGrantId = grantIdMap.get(data.grantId);
    if (!newGrantId) continue;

    const existing = await database.grantApplication.findFirst({
      where: { externalId: data.externalId, grantId: newGrantId },
      select: { id: true },
    });

    if (existing) {
      await database.grantApplication.update({
        where: { id: existing.id },
        data: {
          ...data,
          grantId: newGrantId,
          submittedAt: data.submittedAt ? new Date(data.submittedAt) : undefined,
          decidedAt: data.decidedAt ? new Date(data.decidedAt) : undefined,
        },
      });
      appIdMap.set(id, existing.id);
    } else {
      const created = await database.grantApplication.create({
        data: {
          ...data,
          grantId: newGrantId,
          submittedAt: data.submittedAt ? new Date(data.submittedAt) : new Date(),
          decidedAt: data.decidedAt ? new Date(data.decidedAt) : undefined,
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
        },
      });
      appIdMap.set(id, created.id);
    }
  }
  console.log(`  Mapped ${appIdMap.size} applications`);

  // 4. Ecosystem Profiles
  console.log(`Importing ${profiles.length} profiles...`);
  const profileIdMap = new Map<string, string>();
  for (const profile of profiles) {
    const { id, createdAt, updatedAt, claimedByUserId, ...data } = profile;

    const existing = await database.ecosystemProfile.findFirst({
      where: { slug: data.slug },
      select: { id: true },
    });

    if (existing) {
      await database.ecosystemProfile.update({
        where: { id: existing.id },
        data: {
          ...data,
          // Don't overwrite claimedByUserId — that's user-specific
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
        },
      });
      profileIdMap.set(id, existing.id);
    } else {
      const created = await database.ecosystemProfile.create({
        data: {
          ...data,
          // Skip claimedByUserId — users are different across environments
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
        },
      });
      profileIdMap.set(id, created.id);
    }
  }
  console.log(`  Mapped ${profileIdMap.size} profiles`);

  // 5. Ecosystem Contributions
  console.log(`Importing ${contributions.length} contributions...`);
  let contribCount = 0;
  for (const contrib of contributions) {
    const newProfileId = profileIdMap.get(contrib.ecosystemProfileId);
    const newAppId = appIdMap.get(contrib.grantApplicationId);
    if (!newProfileId || !newAppId) continue;

    await database.ecosystemContribution.upsert({
      where: {
        ecosystemProfileId_grantApplicationId: {
          ecosystemProfileId: newProfileId,
          grantApplicationId: newAppId,
        },
      },
      update: { role: contrib.role },
      create: {
        ecosystemProfileId: newProfileId,
        grantApplicationId: newAppId,
        role: contrib.role,
        createdAt: new Date(contrib.createdAt),
      },
    });
    contribCount++;
  }
  console.log(`  Created ${contribCount} contributions`);

  // 6. Grant Milestones
  console.log(`Importing ${milestones.length} milestones...`);
  let msCount = 0;
  for (const ms of milestones) {
    const { id, createdAt, updatedAt, ...data } = ms;
    const newAppId = appIdMap.get(data.grantApplicationId);
    if (!newAppId) continue;

    const existing = await database.grantMilestone.findFirst({
      where: {
        grantApplicationId: newAppId,
        number: data.number,
      },
      select: { id: true },
    });

    const msData = {
      ...data,
      grantApplicationId: newAppId,
      submittedAt: data.submittedAt ? new Date(data.submittedAt) : undefined,
      reviewedAt: data.reviewedAt ? new Date(data.reviewedAt) : undefined,
      paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
    };

    if (existing) {
      await database.grantMilestone.update({
        where: { id: existing.id },
        data: msData,
      });
    } else {
      await database.grantMilestone.create({
        data: {
          ...msData,
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt),
        },
      });
    }
    msCount++;
  }
  console.log(`  Created ${msCount} milestones`);

  console.log("\nImport complete!");
  await database.$disconnect();
}

main().catch(console.error);
