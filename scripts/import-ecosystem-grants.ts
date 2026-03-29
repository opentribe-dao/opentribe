#!/usr/bin/env tsx
/**
 * Ecosystem Grants Import Pipeline
 *
 * Imports grant applications from W3F, Polkadot Open Source Grants,
 * and Polkadot Fast Grants into the Opentribe database.
 *
 * Usage:
 *   pnpm tsx scripts/import-ecosystem-grants.ts --source w3f
 *   pnpm tsx scripts/import-ecosystem-grants.ts --source fast-grants
 *   pnpm tsx scripts/import-ecosystem-grants.ts --source open-source
 *   pnpm tsx scripts/import-ecosystem-grants.ts --source all
 *   pnpm tsx scripts/import-ecosystem-grants.ts --source w3f --dry-run
 *   pnpm tsx scripts/import-ecosystem-grants.ts --source w3f --limit 20
 */

import { parseArgs } from "node:util";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { database } from "./lib/db";
import { parseGrantApplication } from "./lib/grant-md-parser";
import {
  parseDeliveryFile,
  parseDeliveryFilename,
  parseEvaluationFile,
  parseEvaluationFilename,
  normalizeProjectSlug,
} from "./lib/milestone-delivery-parser";
import { GitHubIdResolver } from "./lib/github-id-resolver";
import { EcosystemProfileMatcher } from "./lib/ecosystem-profile-matcher";
import { SOURCE_CONFIGS, type GrantSource, type SourceConfig } from "./lib/types";

// --- CLI Args ---

const { values: args } = parseArgs({
  options: {
    source: { type: "string", default: "w3f" },
    "dry-run": { type: "boolean", default: false },
    limit: { type: "string" }, // Max applications to process
    "skip-github": { type: "boolean", default: false }, // Skip GitHub ID resolution
    verbose: { type: "boolean", default: false },
    output: { type: "string" }, // Export parsed data to JSON file for review
    "from-file": { type: "string" }, // Import from a reviewed JSON file instead of fetching
  },
});

const dryRun = args["dry-run"] ?? false;
const limit = args.limit ? parseInt(args.limit, 10) : undefined;
const skipGitHub = args["skip-github"] ?? false;
const verbose = args.verbose ?? false;
const outputFile = args.output;
const fromFile = args["from-file"];

const logger = {
  log: (msg: string) => console.log(msg),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string, err?: unknown) =>
    console.error(`[ERROR] ${msg}`, err ?? ""),
};

// --- GitHub API Fetching ---

async function fetchRepoFiles(
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<{ name: string; download_url: string }[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "opentribe-import",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(
      `GitHub API error fetching ${url}: ${response.status} ${response.statusText}`
    );
  }

  const files: any[] = await response.json();
  return files
    .filter(
      (f: any) =>
        f.type === "file" &&
        f.name.endsWith(".md") &&
        f.name !== "README.md"
    )
    .map((f: any) => ({
      name: f.name,
      download_url: f.download_url,
    }));
}

/**
 * Fetch the GitHub username of the author who added a file (first commit).
 * Uses the commits API with path filter.
 */
async function fetchFileAuthor(
  owner: string,
  repo: string,
  filePath: string,
  branch: string
): Promise<{ username: string; date: string } | null> {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(filePath)}&sha=${branch}&per_page=1&page=1`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "opentribe-import",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    // The commits API returns newest first. We want the oldest (first commit).
    // Use per_page=1 and get the Link header to find the last page.
    const response = await fetch(url, { headers });
    if (!response.ok) return null;

    // Check Link header for last page
    const linkHeader = response.headers.get("Link");
    let commits: any[] = await response.json();

    if (linkHeader) {
      // Parse last page URL from Link header
      const lastMatch = linkHeader.match(/<([^>]+)>;\s*rel="last"/);
      if (lastMatch) {
        const lastResponse = await fetch(lastMatch[1], { headers });
        if (lastResponse.ok) {
          commits = await lastResponse.json();
        }
      }
    }

    // Get the last commit (oldest = file creation)
    const lastCommit = commits[commits.length - 1];
    if (!lastCommit) return null;

    return {
      username: lastCommit.author?.login || lastCommit.commit?.author?.name || null,
      date: lastCommit.commit?.author?.date || lastCommit.commit?.committer?.date || null,
    };
  } catch {
    return null;
  }
}

async function fetchFileContent(url: string): Promise<string> {
  const headers: Record<string, string> = {
    "User-Agent": "opentribe-import",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

// --- Main Import Logic ---

async function importSource(config: SourceConfig): Promise<{
  processed: number;
  errors: number;
  profiles: number;
  applications: number;
  milestones: number;
}> {
  const stats = {
    processed: 0,
    errors: 0,
    profiles: 0,
    applications: 0,
    milestones: 0,
  };

  logger.log(`\n${"=".repeat(60)}`);
  logger.log(`Importing: ${config.grantTitle}`);
  logger.log(`Source: ${fromFile ? `file: ${fromFile}` : `${config.repoOwner}/${config.repoName}`}`);
  logger.log(`Dry run: ${dryRun}`);
  if (outputFile) logger.log(`Output: ${outputFile}`);
  logger.log(`${"=".repeat(60)}\n`);

  // 1. Create ImportJob
  let importJob: { id: string } | null = null;
  if (!dryRun && !outputFile) {
    importJob = await database.importJob.create({
      data: {
        source: config.source,
        status: "RUNNING",
        startedAt: new Date(),
        metadata: {
          repo: `${config.repoOwner}/${config.repoName}`,
          branch: config.branch,
          limit: limit ?? null,
          skipGitHub,
          fromFile: fromFile ?? null,
        },
      },
    });
  }

  try {
    // 2. Fetch application files (or load from file)
    let files: { name: string; download_url: string }[] = [];

    if (!fromFile) {
      logger.log("Fetching application files from GitHub...");
      files = await fetchRepoFiles(
        config.repoOwner,
        config.repoName,
        config.applicationsDir,
        config.branch
      );

      // Filter out template, index, and special files
      files = files.filter(
        (f) =>
          !f.name.includes("template") &&
          !f.name.includes("maintenance") &&
          !f.name.startsWith(".") &&
          f.name !== "index.md"
      );

      logger.log(`Found ${files.length} application files`);

      if (limit) {
        files = files.slice(0, limit);
        logger.log(`Limiting to ${limit} files`);
      }
    }

    // 3. Create/find Organization
    let orgId: string | undefined;
    if (!dryRun) {
      const orgType = config.source === "w3f" ? "FOUNDATION" : "CURATOR_GROUP";
      const org = await database.organization.upsert({
        where: { slug: config.orgSlug },
        update: {
          name: config.orgName,
          orgType: orgType as any,
          managedByPlatform: true,
          ecosystemSource: config.ecosystemSource,
          visibility: "VERIFIED",
          isVerified: true,
          claimableBy:
            config.source === "w3f" ? "github:w3f" : undefined,
        },
        create: {
          name: config.orgName,
          slug: config.orgSlug,
          orgType: orgType as any,
          managedByPlatform: true,
          ecosystemSource: config.ecosystemSource,
          visibility: "VERIFIED",
          isVerified: true,
          claimableBy:
            config.source === "w3f" ? "github:w3f" : undefined,
        },
      });
      orgId = org.id;
      logger.log(`Organization: ${org.slug} (${org.id})`);
    }

    // 4. Create/find Grant
    let grantId: string | undefined;
    if (!dryRun && orgId) {
      const grant = await database.grant.upsert({
        where: { externalId: config.grantExternalId },
        update: {
          title: config.grantTitle,
          organizationId: orgId,
          fundingSource: config.fundingSource as any,
        },
        create: {
          title: config.grantTitle,
          slug: config.orgSlug + "-grants",
          externalId: config.grantExternalId,
          description: `Grant applications from the ${config.grantTitle}. Imported from GitHub.`,
          organizationId: orgId,
          status: "CLOSED",
          visibility: "PUBLISHED",
          source: "EXTERNAL",
          fundingSource: config.fundingSource as any,
          publishedAt: new Date(),
        },
      });
      grantId = grant.id;
      logger.log(`Grant: ${grant.slug} (${grant.id})`);
    }

    // 5. Initialize GitHub resolver and profile matcher
    const githubResolver = new GitHubIdResolver({ logger });
    const matcher = dryRun || outputFile
      ? null
      : new EcosystemProfileMatcher(database, config.source, logger);

    if (matcher) await matcher.initialize();

    // 6. Parse all applications (from GitHub or from file)
    const parsed: { filename: string; app: ReturnType<typeof parseGrantApplication> }[] = [];

    if (fromFile) {
      // Load from reviewed JSON file
      const filePath = resolve(process.cwd(), fromFile);
      logger.log(`Loading from file: ${filePath}`);
      const fileData = JSON.parse(readFileSync(filePath, "utf-8"));

      if (fileData.source !== config.source) {
        throw new Error(
          `File source "${fileData.source}" doesn't match --source "${config.source}"`
        );
      }

      // Re-parse from the exported data (we need full ParsedApplication objects)
      // The export only contains summaries, so we need to re-fetch the actual files
      logger.log(
        `File contains ${fileData.applications.length} applications. Re-fetching full content...`
      );

      const appSlugs = new Set(
        fileData.applications.map((a: any) => a.filename)
      );

      // Fetch all files from GitHub, filter to only those in the review file
      const allFiles = await fetchRepoFiles(
        config.repoOwner,
        config.repoName,
        config.applicationsDir,
        config.branch
      );
      const filteredFiles = allFiles.filter((f) => appSlugs.has(f.name));
      logger.log(
        `Matched ${filteredFiles.length}/${fileData.applications.length} files from repo`
      );

      for (const file of filteredFiles) {
        try {
          const content = await fetchFileContent(file.download_url);
          const app = parseGrantApplication(content, file.name);
          parsed.push({ filename: file.name, app });
          stats.processed++;
        } catch (err) {
          stats.errors++;
          logger.error(`Failed to parse ${file.name}:`, err);
        }
      }
    } else {
      // Parse from GitHub directly
      logger.log("\nParsing application files...");

      for (const file of files) {
        try {
          const content = await fetchFileContent(file.download_url);
          const app = parseGrantApplication(content, file.name);
          parsed.push({ filename: file.name, app });
          stats.processed++;

          if (verbose) {
            logger.log(
              `  Parsed: ${file.name} → ${app.title} (${app.teamMembers.length} members, ${app.milestones.length} milestones)`
            );
          }
        } catch (err) {
          stats.errors++;
          logger.error(`Failed to parse ${file.name}:`, err);
        }
      }
    }

    logger.log(
      `Parsed ${parsed.length}/${files.length} applications (${stats.errors} errors)`
    );

    // 6b. Export to JSON if --output is specified
    if (outputFile) {
      const outputPath = resolve(process.cwd(), outputFile);
      const dir = dirname(outputPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

      const exportData = {
        source: config.source,
        exportedAt: new Date().toISOString(),
        stats: {
          totalFiles: files.length,
          parsed: parsed.length,
          errors: stats.errors,
          uniqueProfiles: countUniqueMembers(parsed.map((p) => p.app)),
          totalMilestones: parsed.reduce(
            (sum, p) => sum + p.app.milestones.length,
            0
          ),
        },
        applications: parsed.map(({ filename, app }) => ({
          filename,
          slug: app.slug,
          title: app.title,
          teamName: app.teamName,
          paymentAddress: app.paymentAddress,
          level: app.level,
          contact: app.contact,
          teamMembers: app.teamMembers,
          totalCosts: app.totalCosts,
          milestones: app.milestones,
          skills: app.skills,
          summary: app.summary,
          // Truncate description for reviewability
          descriptionPreview: app.description?.substring(0, 300) ?? "",
        })),
      };

      writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
      logger.log(`\nExported parsed data to: ${outputPath}`);
      logger.log(
        `Review the file, then run: pnpm tsx scripts/import-ecosystem-grants.ts --from-file ${outputFile} --source ${config.source}`
      );
      return stats;
    }

    // 7. Collect all GitHub handles for batch resolution
    if (!skipGitHub) {
      const allHandles = new Set<string>();
      for (const { app } of parsed) {
        for (const member of app.teamMembers) {
          if (member.github) {
            allHandles.add(member.github.toLowerCase().replace(/^@/, ""));
          }
        }
      }

      if (allHandles.size > 0) {
        logger.log(`\nResolving ${allHandles.size} GitHub handles...`);
        await githubResolver.resolveMany([...allHandles]);
        const resolverStats = githubResolver.stats;
        logger.log(
          `GitHub resolution: ${resolverStats.resolved} resolved, ${resolverStats.failed} failed`
        );
      }
    }

    // 8. Write to database
    if (dryRun) {
      logger.log("\n[DRY RUN] Would create:");
      logger.log(`  Profiles: ~${countUniqueMembers(parsed.map((p) => p.app))}`);
      logger.log(`  Applications: ${parsed.length}`);
      logger.log(
        `  Milestones: ${parsed.reduce((sum, p) => sum + p.app.milestones.length, 0)}`
      );

      // Print sample
      if (parsed.length > 0) {
        const sample = parsed[0];
        logger.log(`\nSample application: ${sample.app.title}`);
        logger.log(`  Team: ${sample.app.teamName}`);
        logger.log(`  Contact: ${JSON.stringify(sample.app.contact)}`);
        logger.log(`  Members: ${sample.app.teamMembers.map((m) => `${m.name} (${m.github || "no github"})`).join(", ")}`);
        logger.log(`  Milestones: ${sample.app.milestones.length}`);
        logger.log(`  Skills: ${sample.app.skills.join(", ")}`);
        logger.log(`  Payment address: ${sample.app.paymentAddress || "none"}`);
      }
    } else if (grantId && matcher) {
      logger.log("\nWriting to database...");

      for (const { filename, app } of parsed) {
        try {
          const externalId = `${config.source}:${app.slug}`;

          // Fetch the GitHub PR author who submitted this application
          let prAuthor: { username: string; date: string } | null = null;
          if (!skipGitHub) {
            prAuthor = await fetchFileAuthor(
              config.repoOwner,
              config.repoName,
              `${config.applicationsDir}/${filename}`,
              config.branch
            );
            if (prAuthor && verbose) {
              logger.log(`  PR author for ${filename}: ${prAuthor.username} (${prAuthor.date})`);
            }
          }

          const submittedAt = prAuthor?.date ? new Date(prAuthor.date) : new Date();

          // Create GrantApplication
          const application = await database.grantApplication.upsert({
            where: {
              // Use grantId + externalId combo for upsert
              // Since externalId isn't unique in schema, use findFirst + create/update
              id: (
                await database.grantApplication.findFirst({
                  where: { externalId, grantId },
                  select: { id: true },
                })
              )?.id ?? "nonexistent",
            },
            update: {
              title: app.title,
              description: app.description || app.title,
              summary: app.summary,
              budget: app.totalCosts
                ? parseBudget(app.totalCosts)
                : undefined,
              paymentAddress: app.paymentAddress,
              status: "APPROVED",
              submittedAt,
            },
            create: {
              grantId,
              externalId,
              title: app.title,
              description: app.description || app.title,
              summary: app.summary,
              budget: app.totalCosts
                ? parseBudget(app.totalCosts)
                : undefined,
              paymentAddress: app.paymentAddress,
              status: "APPROVED",
              label: "Reviewed",
              submittedAt,
              decidedAt: submittedAt,
            },
          });
          stats.applications++;

          // If the first team member (applicant) has no GitHub, use the PR author
          if (
            prAuthor?.username &&
            app.teamMembers.length > 0 &&
            !app.teamMembers[0].github
          ) {
            app.teamMembers[0].github = prAuthor.username;
          }

          // Create EcosystemProfiles + Contributions for team members
          for (let i = 0; i < app.teamMembers.length; i++) {
            const member = app.teamMembers[i];
            const isApplicant = i === 0; // First member is the applicant/contact

            const ghHandle = member.github
              ?.toLowerCase()
              .replace(/^@/, "");
            let githubAccountId: string | undefined;
            if (ghHandle && !skipGitHub) {
              const resolved = await githubResolver.resolve(ghHandle);
              githubAccountId = resolved?.accountId;
            }

            const profile = await matcher.findOrCreate({
              member,
              contact: isApplicant ? app.contact : undefined,
              githubAccountId,
              isApplicant,
            });

            if (profile.isNew) stats.profiles++;

            await matcher.createContribution(
              profile.id,
              application.id,
              isApplicant ? "APPLICANT" : "TEAM_MEMBER"
            );
          }

          // Create GrantMilestones
          for (const milestone of app.milestones) {
            await database.grantMilestone.upsert({
              where: {
                grantApplicationId_number: {
                  grantApplicationId: application.id,
                  number: milestone.number,
                },
              },
              update: {
                title: milestone.title,
                amount: milestone.costs
                  ? parseBudget(milestone.costs)
                  : undefined,
              },
              create: {
                grantApplicationId: application.id,
                number: milestone.number,
                title: milestone.title,
                description: milestone.estimatedDuration
                  ? `Duration: ${milestone.estimatedDuration}, FTE: ${milestone.fte || "N/A"}`
                  : undefined,
                amount: milestone.costs
                  ? parseBudget(milestone.costs)
                  : undefined,
                deliverables:
                  milestone.deliverables.length > 0
                    ? milestone.deliverables
                    : undefined,
                status: "PENDING",
              },
            });
            stats.milestones++;
          }

          if (verbose) {
            logger.log(`  Imported: ${app.title}`);
          }
        } catch (err) {
          stats.errors++;
          logger.error(`Failed to import ${filename}:`, err);
        }
      }
    }

    // 9. Import milestone deliveries + evaluations (W3F only)
    if (!dryRun && config.hasDeliveries && config.deliveryRepoOwner) {
      await importDeliveries(config, grantId!);
    }

    // 10. Update ImportJob
    if (importJob) {
      await database.importJob.update({
        where: { id: importJob.id },
        data: {
          status: stats.errors > 0 ? "PARTIAL" : "COMPLETED",
          totalItems: files.length,
          processed: stats.processed,
          errors: stats.errors,
          completedAt: new Date(),
        },
      });
    }
  } catch (err) {
    if (importJob) {
      await database.importJob.update({
        where: { id: importJob.id },
        data: {
          status: "IMPORT_FAILED",
          errorLog: { fatal: String(err) },
          completedAt: new Date(),
        },
      });
    }
    throw err;
  }

  logger.log(`\nImport complete for ${config.grantTitle}:`);
  logger.log(`  Processed: ${stats.processed}`);
  logger.log(`  Profiles created: ${stats.profiles}`);
  logger.log(`  Applications: ${stats.applications}`);
  logger.log(`  Milestones: ${stats.milestones}`);
  logger.log(`  Errors: ${stats.errors}`);

  return stats;
}

// --- Milestone Delivery Import ---

async function importDeliveries(
  config: SourceConfig,
  grantId: string
): Promise<void> {
  if (!config.deliveryRepoOwner || !config.deliveryRepoName) return;

  logger.log("\nImporting milestone deliveries...");

  try {
    // Fetch delivery files
    const deliveryFiles = await fetchRepoFiles(
      config.deliveryRepoOwner,
      config.deliveryRepoName,
      "deliveries",
      "master"
    );

    logger.log(`Found ${deliveryFiles.length} delivery files`);

    // Build a map of application slug → application ID
    const applications = await database.grantApplication.findMany({
      where: { grantId },
      select: { id: true, externalId: true },
    });
    const appMap = new Map<string, string>();
    for (const app of applications) {
      if (app.externalId) {
        const slug = app.externalId.replace(`${config.source}:`, "");
        appMap.set(normalizeProjectSlug(slug), app.id);
      }
    }

    let matched = 0;
    let unmatched = 0;

    for (const file of deliveryFiles) {
      try {
        const parsed = parseDeliveryFilename(file.name);
        if (!parsed) continue;

        const normalizedSlug = normalizeProjectSlug(parsed.projectSlug);
        const appId = appMap.get(normalizedSlug);

        if (!appId) {
          unmatched++;
          if (verbose) {
            logger.warn(`No matching app for delivery: ${file.name} (slug: ${normalizedSlug})`);
          }
          continue;
        }

        // Fetch and parse the delivery file
        const content = await fetchFileContent(file.download_url);
        const delivery = parseDeliveryFile(content, file.name);
        if (!delivery) continue;

        // Update the corresponding GrantMilestone
        await database.grantMilestone.updateMany({
          where: {
            grantApplicationId: appId,
            number: delivery.milestoneNumber,
          },
          data: {
            status: "SUBMITTED",
            deliveryUrl: `https://github.com/${config.deliveryRepoOwner}/${config.deliveryRepoName}/blob/master/deliveries/${file.name}`,
            submittedAt: new Date(),
          },
        });
        matched++;
      } catch (err) {
        if (verbose) {
          logger.error(`Failed to process delivery ${file.name}:`, err);
        }
      }
    }

    logger.log(
      `Deliveries: ${matched} matched, ${unmatched} unmatched`
    );

    // Fetch evaluation files
    logger.log("Importing evaluations...");
    const evalFiles = await fetchRepoFiles(
      config.deliveryRepoOwner,
      config.deliveryRepoName,
      "evaluations",
      "master"
    );

    logger.log(`Found ${evalFiles.length} evaluation files`);

    let evalMatched = 0;

    for (const file of evalFiles) {
      try {
        const parsed = parseEvaluationFilename(file.name);
        if (!parsed) continue;

        const normalizedSlug = normalizeProjectSlug(parsed.projectSlug);
        const appId = appMap.get(normalizedSlug);
        if (!appId) continue;

        // Fetch and parse
        const content = await fetchFileContent(file.download_url);
        const evaluation = parseEvaluationFile(content, file.name);
        if (!evaluation) continue;

        // Update milestone with evaluation data
        const newStatus =
          evaluation.status === "accepted"
            ? "ACCEPTED"
            : evaluation.status === "rejected"
              ? "REJECTED"
              : "UNDER_REVIEW";

        await database.grantMilestone.updateMany({
          where: {
            grantApplicationId: appId,
            number: evaluation.milestoneNumber,
          },
          data: {
            status: newStatus as any,
            evaluationUrl: `https://github.com/${config.deliveryRepoOwner}/${config.deliveryRepoName}/blob/master/evaluations/${file.name}`,
            evaluationResult: evaluation.status,
            evaluatorName: evaluation.evaluatorName,
            reviewedAt: new Date(),
          },
        });
        evalMatched++;
      } catch (err) {
        if (verbose) {
          logger.error(`Failed to process evaluation ${file.name}:`, err);
        }
      }
    }

    logger.log(`Evaluations: ${evalMatched} matched`);
  } catch (err) {
    logger.error("Failed to import deliveries:", err);
  }
}

// --- Helpers ---

function parseBudget(costStr: string): number | undefined {
  // Extract numeric value from strings like "30,000 USD", "$10000", "8,000"
  const cleaned = costStr
    .replace(/[,$]/g, "")
    .replace(/\s*(usd|usdc|usdt|dai|dot|btc|eur)\s*/gi, "")
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

function countUniqueMembers(
  apps: ReturnType<typeof parseGrantApplication>[]
): number {
  const handles = new Set<string>();
  for (const app of apps) {
    for (const member of app.teamMembers) {
      if (member.github) {
        handles.add(member.github.toLowerCase());
      } else {
        handles.add(member.name.toLowerCase());
      }
    }
  }
  return handles.size;
}

// --- Main ---

async function main(): Promise<void> {
  const sourceArg = args.source as string;

  logger.log("Opentribe Ecosystem Grants Import");
  logger.log(`Source: ${sourceArg}`);
  logger.log(`Dry run: ${dryRun}`);
  logger.log(`Limit: ${limit ?? "none"}`);
  logger.log(`Skip GitHub: ${skipGitHub}`);
  logger.log("");

  const sources: GrantSource[] =
    sourceArg === "all"
      ? ["w3f", "open-source", "fast-grants"]
      : [sourceArg as GrantSource];

  for (const source of sources) {
    const config = SOURCE_CONFIGS[source];
    if (!config) {
      logger.error(`Unknown source: ${source}`);
      logger.log("Valid sources: w3f, open-source, fast-grants, all");
      process.exit(1);
    }

    await importSource(config);
  }
}

main()
  .catch((err) => {
    logger.error("Import failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await database.$disconnect();
  });
