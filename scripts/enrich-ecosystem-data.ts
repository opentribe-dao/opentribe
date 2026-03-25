/**
 * Enrich ecosystem data with Wisesama identity lookups and Subscan payment matching.
 *
 * Phase 1: Extract clean Polkadot addresses from grant applications
 * Phase 2: Batch-query Wisesama for on-chain identity data
 * Phase 3: Update ecosystem profiles with wallet addresses and identity info
 * Phase 4: Query Subscan for payment transactions (requires SUBSCAN_API_KEY)
 *
 * Usage:
 *   pnpm tsx scripts/enrich-ecosystem-data.ts --phase identity
 *   pnpm tsx scripts/enrich-ecosystem-data.ts --phase payments
 *   pnpm tsx scripts/enrich-ecosystem-data.ts --phase all
 *   pnpm tsx scripts/enrich-ecosystem-data.ts --phase identity --dry-run
 */

import { parseArgs } from "node:util";
import { database } from "./lib/db";

// --- CLI Args ---

const { values: args } = parseArgs({
  options: {
    phase: { type: "string", default: "all" },
    "dry-run": { type: "boolean", default: false },
    verbose: { type: "boolean", default: false },
    limit: { type: "string" },
  },
});

const dryRun = args["dry-run"] ?? false;
const verbose = args.verbose ?? false;
const limit = args.limit ? parseInt(args.limit, 10) : undefined;
const phase = args.phase ?? "all";

const WISESAMA_API = "https://api.wisesama.com/api/v1";
const SUBSCAN_API = "https://polkadot.api.subscan.io";
const SUBSCAN_API_KEY = process.env.SUBSCAN_API_KEY;
const BATCH_SIZE = 20; // Wisesama batch max 50, but be conservative
const SUBSCAN_RATE_LIMIT_MS = 250; // 4 req/s to stay under 5 req/s free limit

// --- Helpers ---

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract a clean Polkadot/Kusama SS58 address from a messy payment field.
 * Valid SS58 addresses: 46-48 chars, base58 charset (no 0, O, I, l).
 */
function extractPolkadotAddress(raw: string): string | null {
  if (!raw) return null;
  // Try exact match first
  const clean = raw.trim();
  if (/^[1-9A-HJ-NP-Za-km-z]{46,48}$/.test(clean)) {
    return clean;
  }
  // Extract from mixed content (e.g., "**DOT**: 1abc... (USDT)")
  const match = clean.match(/\b([1-9A-HJ-NP-Za-km-z]{46,48})\b/);
  return match ? match[1] : null;
}

/**
 * Check if an address looks like Polkadot (prefix 1) or Kusama (prefix C-H or others).
 * Simple heuristic based on first character.
 */
function detectChain(address: string): "polkadot" | "kusama" {
  // Polkadot addresses typically start with 1
  // Kusama addresses typically start with C-H range
  // This is a rough heuristic — proper SS58 decoding would be more accurate
  if (address.startsWith("1")) return "polkadot";
  return "polkadot"; // default to polkadot for now
}

// --- Wisesama Client ---

interface WisesamaIdentity {
  hasIdentity: boolean;
  isVerified: boolean;
  displayName: string | null;
  twitter: string | null;
  web: string | null;
  riot: string | null;
  email: string | null;
  judgements: Array<{ registrarId: number; judgement: string }>;
}

interface WisesamaCheckResult {
  entity: string;
  entityType: string;
  chain: string | null;
  assessment: {
    riskLevel: string;
    riskScore: number | null;
  };
  identity: WisesamaIdentity;
  transactionSummary?: {
    totalTransactions: number;
    totalReceived: string;
    totalSent: string;
    currentBalance: string;
  };
}

async function wisesamamBatchCheck(
  entities: string[]
): Promise<WisesamaCheckResult[]> {
  const response = await fetch(`${WISESAMA_API}/check/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entities }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Wisesama batch check failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  // Batch results can be at data.results (direct) or data.data.results (wrapped)
  const results = data.data?.results || data.results || [];
  // Each result may be wrapped in .data or be direct
  return results.map((r: any) => r.data || r);
}

async function wisesamamIdentityLookup(
  address: string,
  chain: string = "polkadot"
): Promise<WisesamaIdentity | null> {
  const response = await fetch(
    `${WISESAMA_API}/identity/${address}?chain=${chain}`
  );
  if (!response.ok) return null;
  const data = await response.json();
  return data.data || null;
}

// --- Subscan Client ---

interface SubscanTransfer {
  from: string;
  to: string;
  amount: string;
  amount_v2: string;
  block_num: number;
  block_timestamp: number;
  extrinsic_index: string;
  hash: string;
  success: boolean;
  module: string;
  asset_symbol: string;
  from_account_display?: { display?: string };
  to_account_display?: { display?: string };
}

async function subscanGetTransfers(
  address: string,
  direction: "received" | "sent" | "all" = "received",
  page: number = 0,
  row: number = 100
): Promise<{ transfers: SubscanTransfer[]; count: number }> {
  if (!SUBSCAN_API_KEY) {
    throw new Error("SUBSCAN_API_KEY not set");
  }

  const response = await fetch(`${SUBSCAN_API}/api/v2/scan/transfers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": SUBSCAN_API_KEY,
    },
    body: JSON.stringify({
      address,
      direction,
      row,
      page,
      asset_symbol: "DOT",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Subscan API failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return {
    transfers: data.data?.transfers || [],
    count: data.data?.count || 0,
  };
}

// --- Phase 1 & 2: Identity Enrichment ---

async function enrichIdentities() {
  console.log("\n=== Phase: Identity Enrichment (Wisesama) ===\n");

  // Get all applications with payment addresses
  const applications = await database.grantApplication.findMany({
    where: {
      externalId: { not: null },
      paymentAddress: { not: null },
    },
    select: {
      id: true,
      externalId: true,
      title: true,
      paymentAddress: true,
      ecosystemContributions: {
        where: { role: "APPLICANT" },
        select: {
          ecosystemProfile: {
            select: {
              id: true,
              displayName: true,
              walletAddresses: true,
              onChainName: true,
              onChainVerified: true,
            },
          },
        },
      },
    },
  });

  console.log(`Found ${applications.length} applications with payment addresses`);

  // Extract unique Polkadot addresses
  const addressMap = new Map<
    string,
    { appId: string; profileId: string | null; title: string }[]
  >();

  for (const app of applications) {
    const address = extractPolkadotAddress(app.paymentAddress || "");
    if (!address) continue;

    const profileId =
      app.ecosystemContributions[0]?.ecosystemProfile?.id || null;
    const entry = { appId: app.id, profileId, title: app.title };

    if (addressMap.has(address)) {
      addressMap.get(address)!.push(entry);
    } else {
      addressMap.set(address, [entry]);
    }
  }

  const uniqueAddresses = [...addressMap.keys()];
  console.log(`Extracted ${uniqueAddresses.length} unique Polkadot addresses`);

  if (uniqueAddresses.length === 0) {
    console.log("No valid Polkadot addresses found. Skipping.");
    return;
  }

  // Batch check via Wisesama
  const allResults: WisesamaCheckResult[] = [];
  const batches = [];
  const addressesToProcess = limit
    ? uniqueAddresses.slice(0, limit)
    : uniqueAddresses;

  for (let i = 0; i < addressesToProcess.length; i += BATCH_SIZE) {
    batches.push(addressesToProcess.slice(i, i + BATCH_SIZE));
  }

  console.log(
    `Processing ${addressesToProcess.length} addresses in ${batches.length} batches...`
  );

  let withIdentity = 0;
  let verified = 0;
  let profilesUpdated = 0;
  let walletsLinked = 0;
  const issues: string[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(
      `  Batch ${i + 1}/${batches.length} (${batch.length} addresses)...`
    );

    try {
      const results = await wisesamamBatchCheck(batch);
      allResults.push(...results);

      for (const result of results) {
        if (!result) continue;
        const address = result.entity;
        const entries = addressMap.get(address);
        if (!entries) continue;

        const identity = result.identity || {};
        const hasIdentity = identity.hasIdentity ?? false;
        const isVerified = identity.isVerified ?? false;
        const displayName = identity.displayName ?? null;

        if (hasIdentity) withIdentity++;
        if (isVerified) verified++;

        if (verbose) {
          const risk = result.assessment?.riskLevel || "?";
          console.log(
            `    ${address.slice(0, 15)}... → ${hasIdentity ? displayName || "unnamed" : "no identity"} ${isVerified ? "(verified)" : ""} [risk: ${risk}]`
          );
        }

        // Update profiles
        for (const entry of entries) {
          if (!entry.profileId) continue;

          if (dryRun) {
            console.log(
              `    [DRY RUN] Would update profile ${entry.profileId} with wallet ${address.slice(0, 15)}...`
            );
            continue;
          }

          try {
            const profile = await database.ecosystemProfile.findUnique({
              where: { id: entry.profileId },
              select: { walletAddresses: true, onChainName: true },
            });

            if (!profile) continue;

            const existingAddresses = new Set(profile.walletAddresses || []);
            const updates: Record<string, any> = {};

            // Add wallet address if not already present
            if (!existingAddresses.has(address)) {
              updates.walletAddresses = [
                ...(profile.walletAddresses || []),
                address,
              ];
              walletsLinked++;
            }

            // Update on-chain identity if found
            if (hasIdentity && identity) {
              if (identity.displayName && !profile.onChainName) {
                updates.onChainName = identity.displayName;
              }
              updates.onChainVerified = isVerified;

              // Enrich with socials from on-chain identity
              const socialUpdates: Record<string, any> = {};
              if (identity.twitter) {
                socialUpdates.twitter = identity.twitter;
              }
              if (identity.web) {
                socialUpdates.website = identity.web;
              }
              if (identity.email) {
                socialUpdates.email = identity.email.toLowerCase();
              }

              // Only update empty fields
              const currentProfile =
                await database.ecosystemProfile.findUnique({
                  where: { id: entry.profileId },
                  select: {
                    twitter: true,
                    website: true,
                    email: true,
                  },
                });

              if (currentProfile) {
                if (socialUpdates.twitter && !currentProfile.twitter) {
                  updates.twitter = socialUpdates.twitter;
                }
                if (socialUpdates.website && !currentProfile.website) {
                  updates.website = socialUpdates.website;
                }
                if (socialUpdates.email && !currentProfile.email) {
                  updates.email = socialUpdates.email;
                }
              }
            }

            if (Object.keys(updates).length > 0) {
              await database.ecosystemProfile.update({
                where: { id: entry.profileId },
                data: updates,
              });
              profilesUpdated++;
            }
          } catch (err) {
            const msg = `Failed to update profile ${entry.profileId}: ${err}`;
            issues.push(msg);
            if (verbose) console.error(`    ${msg}`);
          }
        }
      }
    } catch (err) {
      console.error(`  Batch ${i + 1} failed:`, err);
      issues.push(`Batch ${i + 1} failed: ${err}`);
    }

    // Rate limit between batches
    if (i < batches.length - 1) {
      await sleep(1000);
    }
  }

  console.log("\n--- Identity Enrichment Summary ---");
  console.log(`  Addresses checked: ${addressesToProcess.length}`);
  console.log(`  With on-chain identity: ${withIdentity}`);
  console.log(`  Verified identities: ${verified}`);
  console.log(`  Profiles updated: ${profilesUpdated}`);
  console.log(`  Wallets linked: ${walletsLinked}`);
  if (issues.length > 0) {
    console.log(`  Issues: ${issues.length}`);
    for (const issue of issues.slice(0, 5)) {
      console.log(`    - ${issue}`);
    }
  }

  // Report on Wisesama API observations
  console.log("\n--- Wisesama API Observations ---");
  const noIdentityCount = allResults.filter(
    (r) => r && !r.identity?.hasIdentity
  ).length;
  const unknownRisk = allResults.filter(
    (r) => r && r.assessment?.riskLevel === "UNKNOWN"
  ).length;
  console.log(`  No identity: ${noIdentityCount}/${allResults.length}`);
  console.log(`  UNKNOWN risk level: ${unknownRisk}/${allResults.length}`);
  if (noIdentityCount === allResults.length && allResults.length > 5) {
    console.log(
      "  NOTE: All addresses returned no identity. This may indicate the Wisesama identity"
    );
    console.log(
      "  database hasn't been synced recently. Check /admin/sync endpoint."
    );
  }
}

// --- Phase 3: Payment Matching (Subscan) ---

async function matchPayments() {
  console.log("\n=== Phase: Payment Matching (Subscan) ===\n");

  if (!SUBSCAN_API_KEY) {
    console.log(
      "SUBSCAN_API_KEY not set. Skipping payment matching."
    );
    console.log(
      "Set SUBSCAN_API_KEY env var to enable. Get a free key at https://pro.subscan.io/"
    );
    return;
  }

  // Get milestones that are ACCEPTED but have no payment info
  const milestones = await database.grantMilestone.findMany({
    where: {
      status: "ACCEPTED",
      paymentTxHash: null,
    },
    select: {
      id: true,
      number: true,
      amount: true,
      token: true,
      grantApplication: {
        select: {
          id: true,
          title: true,
          paymentAddress: true,
        },
      },
    },
    take: limit,
  });

  console.log(
    `Found ${milestones.length} accepted milestones without payment data`
  );

  // Group by payment address
  const addressMilestones = new Map<
    string,
    Array<{
      milestoneId: string;
      milestoneNumber: number;
      amount: string | null;
      appTitle: string;
    }>
  >();

  for (const m of milestones) {
    const address = extractPolkadotAddress(
      m.grantApplication?.paymentAddress || ""
    );
    if (!address) continue;

    const entry = {
      milestoneId: m.id,
      milestoneNumber: m.number,
      amount: m.amount ? String(m.amount) : null,
      appTitle: m.grantApplication?.title || "Unknown",
    };

    if (addressMilestones.has(address)) {
      addressMilestones.get(address)!.push(entry);
    } else {
      addressMilestones.set(address, [entry]);
    }
  }

  const uniquePaymentAddresses = [...addressMilestones.keys()];
  console.log(
    `  ${uniquePaymentAddresses.length} unique payment addresses to query`
  );

  let matched = 0;
  let notMatched = 0;
  const issues: string[] = [];

  for (const address of uniquePaymentAddresses) {
    try {
      const { transfers, count } = await subscanGetTransfers(
        address,
        "received"
      );

      if (verbose) {
        console.log(
          `  ${address.slice(0, 15)}... → ${count} received transfers`
        );
      }

      const milestoneEntries = addressMilestones.get(address)!;

      // Try to match transfers to milestones
      // W3F typically pays from treasury or a specific multisig
      // Match by amount if available, otherwise just record all DOT transfers
      for (const entry of milestoneEntries) {
        // Look for a transfer matching the milestone amount
        let matchedTransfer: SubscanTransfer | null = null;

        if (entry.amount) {
          const expectedDot = parseFloat(entry.amount);
          // Find a transfer close to the expected amount (within 5% tolerance)
          // Subscan amounts are in Planck (1 DOT = 10^10 Planck)
          matchedTransfer =
            transfers.find((t) => {
              const txDot =
                parseFloat(t.amount_v2 || t.amount) / 1e10;
              return (
                t.success &&
                expectedDot > 0 &&
                Math.abs(txDot - expectedDot) / expectedDot < 0.05
              );
            }) || null;
        }

        if (!matchedTransfer && transfers.length > 0) {
          // Fall back: use the largest received DOT transfer
          // This is imprecise but better than nothing for traceability
          matchedTransfer = transfers
            .filter((t) => t.success)
            .sort(
              (a, b) =>
                parseFloat(b.amount_v2 || b.amount) -
                parseFloat(a.amount_v2 || a.amount)
            )[0] || null;
        }

        if (matchedTransfer && !dryRun) {
          // Convert Planck to DOT (1 DOT = 10^10 Planck)
          const rawAmount = matchedTransfer.amount_v2 || matchedTransfer.amount;
          const dotAmount = (
            parseFloat(rawAmount) / 1e10
          ).toFixed(4);

          await database.grantMilestone.update({
            where: { id: entry.milestoneId },
            data: {
              paymentStatus: "CONFIRMED",
              paymentTxHash: matchedTransfer.hash,
              paymentBlockNumber: matchedTransfer.block_num,
              paymentAmount: dotAmount,
              paymentToken: "DOT",
              paymentChain: "polkadot",
              paymentAddress: address,
              paidAt: new Date(matchedTransfer.block_timestamp * 1000),
              payerAddress:
                matchedTransfer.from_account_display?.display ||
                matchedTransfer.from,
            },
          });
          matched++;

          if (verbose) {
            console.log(
              `    M${entry.milestoneNumber} (${entry.appTitle}) → matched tx ${matchedTransfer.hash.slice(0, 15)}... (${dotAmount} DOT)`
            );
          }
        } else if (matchedTransfer && dryRun) {
          const rawAmount = matchedTransfer.amount_v2 || matchedTransfer.amount;
          const dotAmount = (parseFloat(rawAmount) / 1e10).toFixed(4);
          console.log(
            `    [DRY RUN] Would match M${entry.milestoneNumber} (${entry.appTitle}) → ${dotAmount} DOT`
          );
          matched++;
        } else {
          notMatched++;
        }
      }
    } catch (err) {
      issues.push(`${address.slice(0, 15)}...: ${err}`);
      if (verbose) console.error(`  Error for ${address}:`, err);
    }

    // Respect rate limit
    await sleep(SUBSCAN_RATE_LIMIT_MS);
  }

  console.log("\n--- Payment Matching Summary ---");
  console.log(`  Addresses queried: ${uniquePaymentAddresses.length}`);
  console.log(`  Milestones matched: ${matched}`);
  console.log(`  Milestones unmatched: ${notMatched}`);
  if (issues.length > 0) {
    console.log(`  Issues: ${issues.length}`);
    for (const issue of issues.slice(0, 5)) {
      console.log(`    - ${issue}`);
    }
  }
}

// --- Main ---

async function main() {
  console.log("Ecosystem Data Enrichment");
  console.log(`  Phase: ${phase}`);
  console.log(`  Dry run: ${dryRun}`);
  console.log(`  Verbose: ${verbose}`);
  if (limit) console.log(`  Limit: ${limit}`);
  console.log();

  try {
    if (phase === "identity" || phase === "all") {
      await enrichIdentities();
    }

    if (phase === "payments" || phase === "all") {
      await matchPayments();
    }

    console.log("\nDone.");
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  } finally {
    await database.$disconnect();
  }
}

main();
