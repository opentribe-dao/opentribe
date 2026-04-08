/**
 * Export all ecosystem data from local DB as a single JSON file.
 * This can be imported into staging/prod without needing GitHub API or cloned repos.
 *
 * Usage:
 *   pnpm tsx scripts/export-ecosystem-data.ts
 *   pnpm tsx scripts/export-ecosystem-data.ts --output data/ecosystem-export.json
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import { database } from "./lib/db";

const { values: args } = parseArgs({
  options: {
    output: { type: "string", default: "data/ecosystem-export.json" },
  },
});

const outputPath = args.output!;

async function main() {
  console.log("Exporting ecosystem data...\n");

  // 1. Organizations (platform-managed only)
  const organizations = await database.organization.findMany({
    where: { managedByPlatform: true },
  });
  console.log(`  Organizations: ${organizations.length}`);

  // 2. Grants (external/imported)
  const grants = await database.grant.findMany({
    where: { source: "EXTERNAL" },
  });
  console.log(`  Grants: ${grants.length}`);

  // 3. Grant Applications (imported)
  const applications = await database.grantApplication.findMany({
    where: { externalId: { not: null } },
  });
  console.log(`  Applications: ${applications.length}`);

  // 4. Ecosystem Profiles
  const profiles = await database.ecosystemProfile.findMany();
  console.log(`  Profiles: ${profiles.length}`);

  // 5. Ecosystem Contributions
  const contributions = await database.ecosystemContribution.findMany();
  console.log(`  Contributions: ${contributions.length}`);

  // 6. Grant Milestones
  const milestones = await database.grantMilestone.findMany();
  console.log(`  Milestones: ${milestones.length}`);

  // 7. Curators
  const curators = await database.curator.findMany({
    where: { ecosystemProfileId: { not: null } },
  });
  console.log(`  Curators: ${curators.length}`);

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: 1,
    counts: {
      organizations: organizations.length,
      grants: grants.length,
      applications: applications.length,
      profiles: profiles.length,
      contributions: contributions.length,
      milestones: milestones.length,
      curators: curators.length,
    },
    data: {
      organizations,
      grants,
      applications,
      profiles,
      contributions,
      milestones,
      curators,
    },
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

  const sizeMB = (Buffer.byteLength(JSON.stringify(exportData)) / 1024 / 1024).toFixed(1);
  console.log(`\nExported to ${outputPath} (${sizeMB} MB)`);

  await database.$disconnect();
}

main().catch(console.error);
