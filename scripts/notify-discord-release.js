#!/usr/bin/env node

/**
 * Manual Discord release notification script.
 *
 * Usage:
 *   DISCORD_WEBHOOK_URL="your-webhook" node scripts/notify-discord-release.js
 *   DISCORD_WEBHOOK_URL="your-webhook" node scripts/notify-discord-release.js v1.1.0
 *
 * Notes:
 * - Uses the GitHub Releases API to fetch either the latest release or a specific tag.
 * - Expects the repository to be public (no auth required). For private repos, set GITHUB_TOKEN.
 */

import { Octokit } from "@octokit/rest";

const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

if (!webhookUrl) {
  console.error("DISCORD_WEBHOOK_URL environment variable is required.");
  process.exit(1);
}

// Read release JSON from stdin if available (from gh CLI)
async function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    if (process.stdin.isTTY) {
      resolve(null);
      return;
    }
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data.trim() || null);
    });
  });
}

// Normalize release data from gh CLI format to GitHub API format
function normalizeRelease(release) {
  // If it's already in GitHub API format (has tag_name), return as-is
  if (release.tag_name) {
    return release;
  }
  // Convert from gh CLI format (tagName) to GitHub API format (tag_name)
  return {
    tag_name: release.tagName,
    name: release.name,
    body: release.body,
    html_url: release.url,
    published_at: release.publishedAt,
  };
}

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const octokit = new Octokit(
  token
    ? {
        auth: token,
      }
    : {}
);

// Determine repository – use GITHUB_REPOSITORY if available, otherwise require CLI arg
let repoSlug = process.env.GITHUB_REPOSITORY;
const [maybeVersionOrRepo, maybeVersion] = process.argv.slice(2);

if (!repoSlug && maybeVersionOrRepo && maybeVersionOrRepo.includes("/")) {
  repoSlug = maybeVersionOrRepo;
}

// Determine release tag (optional)
const tag =
  repoSlug === maybeVersionOrRepo
    ? maybeVersion // when repo is first arg and tag second
    : maybeVersionOrRepo; // when only tag is provided

async function fetchRelease() {
  // Try reading from stdin first (from gh CLI)
  const stdinData = await readStdin();
  if (stdinData) {
    try {
      const release = JSON.parse(stdinData);
      return normalizeRelease(release);
    } catch (e) {
      console.error("Failed to parse JSON from stdin:", e.message);
      process.exit(1);
    }
  }

  // Fall back to Octokit API
  if (!repoSlug) {
    console.error(
      "Repository is not specified. Set GITHUB_REPOSITORY=owner/repo or pass it as the first argument (owner/repo)."
    );
    process.exit(1);
  }

  const [owner, repo] = repoSlug.split("/");

  if (tag) {
    const res = await octokit.repos.getReleaseByTag({
      owner,
      repo,
      tag,
    });
    return res.data;
  }

  const res = await octokit.repos.getLatestRelease({
    owner,
    repo,
  });
  return res.data;
}

async function sendDiscordNotification(release) {
  const {
    tag_name: tagName,
    name,
    body,
    html_url: htmlUrl,
    published_at: publishedAt,
  } = release;

  const title = `🚀 ${name || tagName} Released`;
  const version = tagName;
  const releaseDate = publishedAt || new Date().toISOString();
  const changelog = body || "No changelog provided.";

  const description =
    changelog.length > 3900 ? `${changelog.slice(0, 3900)}\n…` : changelog;

  const embed = {
    title,
    description,
    color: 0xe6007a,
    fields: [
      {
        name: "📦 Version",
        value: version || "N/A",
        inline: true,
      },
      {
        name: "📅 Released",
        value: releaseDate,
        inline: true,
      },
      {
        name: "🔗 Links",
        value: `[View on GitHub](${htmlUrl})`,
      },
    ],
    timestamp: releaseDate,
  };

  const payload = {
    embeds: [embed],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to send Discord notification:", res.status, text);
    process.exit(1);
  }

  console.log("Discord notification sent successfully.");
}

async function main() {
  try {
    const release = await fetchRelease();
    await sendDiscordNotification(release);
  } catch (error) {
    console.error("Error while sending Discord release notification:", error);
    process.exit(1);
  }
}

await main();
