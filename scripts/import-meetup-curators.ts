#!/usr/bin/env tsx
/**
 * Import meetup bounty curator profiles from Google Sheets.
 *
 * Source: Polkadot Meetups Bounty #43 curator roster
 * Spreadsheet: https://docs.google.com/spreadsheets/d/1hNdflU8hB0J58Kv6VacVVItasnGga_JeOEuJ98eBkw4/
 *
 * Creates EcosystemProfiles for curators with wallet addresses and contact info.
 *
 * Usage:
 *   pnpm tsx scripts/import-meetup-curators.ts --dry-run
 *   pnpm tsx scripts/import-meetup-curators.ts
 */

import { parseArgs } from "node:util";
import { database } from "./lib/db";

const SPREADSHEET_ID = "1hNdflU8hB0J58Kv6VacVVItasnGga_JeOEuJ98eBkw4";
// Also check the newer spreadsheet mentioned in the original
const SPREADSHEET_ID_NEW = "1cnhctdMbUnyXlCR75ZEBoDHxBBxRRdlEfEsx76LA5tI";

const { values: args } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    verbose: { type: "boolean", default: false },
  },
});

const dryRun = args["dry-run"] ?? false;
const verbose = args.verbose ?? false;

interface CuratorRow {
  name: string;
  walletAddress?: string;
  description?: string;
  region?: string;
  telegram?: string;
  twitter?: string;
}

async function fetchSheetAsCSV(spreadsheetId: string): Promise<string | null> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch sheet ${spreadsheetId}: ${response.status}`);
      return null;
    }
    return response.text();
  } catch (err) {
    console.warn(`Error fetching sheet ${spreadsheetId}:`, err);
    return null;
  }
}

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++; // Skip escaped quote
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if (char === "\n" && !inQuotes) {
      row.push(current.trim());
      if (row.some((cell) => cell !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  // Last row
  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.some((cell) => cell !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function extractCurators(rows: string[][]): CuratorRow[] {
  if (rows.length < 2) return [];

  // Try to find column indices from header
  const header = rows[0].map((h) => h.toLowerCase());
  const nameIdx = header.findIndex(
    (h) => h.includes("name") && !h.includes("wallet")
  );
  const walletIdx = header.findIndex(
    (h) => h.includes("wallet") || h.includes("address") || h.includes("polkadot")
  );
  const descIdx = header.findIndex(
    (h) => h.includes("description") || h.includes("brief") || h.includes("bio")
  );
  const regionIdx = header.findIndex(
    (h) => h.includes("region") || h.includes("country") || h.includes("location")
  );
  const telegramIdx = header.findIndex((h) => h.includes("telegram"));
  const twitterIdx = header.findIndex(
    (h) => h.includes("twitter") || h.includes("x.com")
  );

  console.log("Header columns found:", {
    name: nameIdx >= 0 ? header[nameIdx] : "NOT FOUND",
    wallet: walletIdx >= 0 ? header[walletIdx] : "NOT FOUND",
    desc: descIdx >= 0 ? header[descIdx] : "NOT FOUND",
    region: regionIdx >= 0 ? header[regionIdx] : "NOT FOUND",
    telegram: telegramIdx >= 0 ? header[telegramIdx] : "NOT FOUND",
    twitter: twitterIdx >= 0 ? header[twitterIdx] : "NOT FOUND",
  });

  const curators: CuratorRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = nameIdx >= 0 ? row[nameIdx] : row[0];

    if (!name || name.length < 2) continue;
    // Skip "moved to" notes
    if (name.toLowerCase().includes("moved") || name.toLowerCase().includes("http")) continue;

    const walletAddress = walletIdx >= 0 ? row[walletIdx] : undefined;
    const description = descIdx >= 0 ? row[descIdx] : undefined;
    const region = regionIdx >= 0 ? row[regionIdx] : undefined;
    const telegram = telegramIdx >= 0 ? row[telegramIdx] : undefined;
    const twitter = twitterIdx >= 0 ? row[twitterIdx] : undefined;

    // Only include if has name and at least one piece of contact info
    if (name && (walletAddress || telegram || twitter)) {
      curators.push({
        name: name.trim(),
        walletAddress: walletAddress?.trim() || undefined,
        description: description?.trim() || undefined,
        region: region?.trim() || undefined,
        telegram: telegram?.trim() || undefined,
        twitter: twitter?.trim() || undefined,
      });
    }
  }

  return curators;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main(): Promise<void> {
  console.log("Meetup Curators Import");
  console.log(`Dry run: ${dryRun}\n`);

  // Try both spreadsheets
  let csv: string | null = null;
  let sheetId = SPREADSHEET_ID;

  csv = await fetchSheetAsCSV(SPREADSHEET_ID);
  if (!csv || csv.length < 50) {
    console.log("Trying newer spreadsheet...");
    csv = await fetchSheetAsCSV(SPREADSHEET_ID_NEW);
    sheetId = SPREADSHEET_ID_NEW;
  }

  if (!csv) {
    console.error("Failed to fetch any spreadsheet data");
    process.exit(1);
  }

  console.log(`Fetched spreadsheet (${csv.length} chars)`);

  const rows = parseCSV(csv);
  console.log(`Parsed ${rows.length} rows`);

  const curators = extractCurators(rows);
  console.log(`Found ${curators.length} curators with contact info\n`);

  if (curators.length === 0) {
    console.log("No curators found. Check spreadsheet format.");
    console.log("First 3 rows:", rows.slice(0, 3));
    return;
  }

  // Print all curators
  for (const c of curators) {
    console.log(`  ${c.name}`);
    if (c.walletAddress) console.log(`    Wallet: ${c.walletAddress.substring(0, 20)}...`);
    if (c.region) console.log(`    Region: ${c.region}`);
    if (c.telegram) console.log(`    Telegram: ${c.telegram}`);
    if (c.twitter) console.log(`    Twitter: ${c.twitter}`);
  }

  if (dryRun) {
    console.log(`\n[DRY RUN] Would create ${curators.length} ecosystem profiles`);
    return;
  }

  // Ensure meetup bounty org exists
  const org = await database.organization.upsert({
    where: { slug: "polkadot-meetups-bounty" },
    update: {
      name: "Polkadot Meetups Bounty",
      managedByPlatform: true,
      ecosystemSource: "ON_CHAIN_BOUNTY",
    },
    create: {
      name: "Polkadot Meetups Bounty",
      slug: "polkadot-meetups-bounty",
      orgType: "CURATOR_GROUP",
      managedByPlatform: true,
      ecosystemSource: "ON_CHAIN_BOUNTY",
      visibility: "VERIFIED",
      isVerified: true,
    },
  });

  console.log(`\nOrganization: ${org.slug} (${org.id})`);

  let created = 0;
  let updated = 0;

  for (const curator of curators) {
    const slug = generateSlug(curator.name);
    const walletAddresses = curator.walletAddress ? [curator.walletAddress] : [];

    // Check for existing profile by wallet or slug
    let existing = walletAddresses.length > 0
      ? await database.ecosystemProfile.findFirst({
          where: { walletAddresses: { hasSome: walletAddresses } },
        })
      : null;

    if (!existing) {
      existing = await database.ecosystemProfile.findFirst({
        where: { slug },
      });
    }

    if (existing) {
      // Update with new info
      await database.ecosystemProfile.update({
        where: { id: existing.id },
        data: {
          telegram: curator.telegram || existing.telegram,
          twitter: curator.twitter || existing.twitter,
          location: curator.region || existing.location,
          bio: curator.description || existing.bio,
          walletAddresses:
            walletAddresses.length > 0 ? walletAddresses : undefined,
        },
      });
      updated++;
      if (verbose) console.log(`  Updated: ${curator.name} (${existing.slug})`);
    } else {
      // Check slug collision with users
      const userExists = await database.user.findFirst({
        where: { username: slug },
      });
      const finalSlug = userExists ? `meetup-${slug}` : slug;

      await database.ecosystemProfile.create({
        data: {
          displayName: curator.name,
          slug: finalSlug,
          telegram: curator.telegram,
          twitter: curator.twitter,
          location: curator.region,
          bio: curator.description,
          walletAddresses,
          source: "ON_CHAIN_BOUNTY",
          sourceData: {
            importSource: "meetup-curators",
            spreadsheetId: sheetId,
            role: "curator",
          },
          contactable: !!(curator.telegram || curator.twitter),
          outreachStatus:
            curator.telegram || curator.twitter ? "PENDING" : null,
        },
      });
      created++;
      if (verbose) console.log(`  Created: ${curator.name} (${finalSlug})`);
    }
  }

  console.log(`\nDone: ${created} created, ${updated} updated`);
  await database.$disconnect();
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
