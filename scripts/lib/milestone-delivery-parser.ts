/**
 * Parser for W3F milestone delivery and evaluation files.
 *
 * Delivery files: w3f/Grant-Milestone-Delivery/deliveries/
 *   Naming: {project}-milestone_{N}.md, {project}-milestone-{N}.md, {project}_Milestone{N}.md
 *
 * Evaluation files: w3f/Grant-Milestone-Delivery/evaluations/
 *   Naming: {project}_m{N}_{evaluator}.md, {project}_{N}_{evaluator}.md
 */

import type { ParsedDelivery, ParsedEvaluation } from "./types";

/**
 * Extract project slug and milestone number from a delivery filename.
 */
export function parseDeliveryFilename(
  filename: string
): { projectSlug: string; milestoneNumber: number } | null {
  const name = filename.replace(/\.md$/i, "");

  // Try patterns in order of specificity:
  // project-milestone_1, project-milestone-1, project_Milestone1, project_milestone_1
  const patterns = [
    /^(.+?)-milestone[_-](\d+)$/i,
    /^(.+?)_[Mm]ilestone[_-]?(\d+)$/i,
    /^(.+?)[_-]m(\d+)$/i,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return {
        projectSlug: match[1].toLowerCase().replace(/_/g, "-"),
        milestoneNumber: parseInt(match[2], 10),
      };
    }
  }

  return null;
}

/**
 * Extract project slug, milestone number, and evaluator from an evaluation filename.
 */
export function parseEvaluationFilename(
  filename: string
): {
  projectSlug: string;
  milestoneNumber: number;
  evaluatorName: string;
} | null {
  const name = filename.replace(/\.md$/i, "");

  // Patterns: project_m1_evaluator, project_1_evaluator, project-m1-evaluator
  const patterns = [
    /^(.+?)[_-]m(\d+)[_-]([a-zA-Z][a-zA-Z0-9_-]*)$/i,
    /^(.+?)[_-](\d+)[_-]([a-zA-Z][a-zA-Z0-9_-]*)$/i,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      return {
        projectSlug: match[1].toLowerCase().replace(/_/g, "-"),
        milestoneNumber: parseInt(match[2], 10),
        evaluatorName: match[3],
      };
    }
  }

  return null;
}

/**
 * Parse a milestone delivery markdown file.
 */
export function parseDeliveryFile(
  content: string,
  filename: string
): ParsedDelivery | null {
  const parsed = parseDeliveryFilename(filename);
  if (!parsed) return null;

  // Extract Application Document URL
  const appDocMatch = content.match(
    /\*\*(?:Application Document|Application|PR Link)\*\*:?\s*\[([^\]]*)\]\(([^)]+)\)/i
  );
  const applicationDocUrl = appDocMatch ? appDocMatch[2] : undefined;

  // Extract Milestone Number (from content, as verification)
  const milestoneMatch = content.match(
    /\*\*Milestone\s*(?:Number)?\*\*:?\s*(\d+)/i
  );
  const contentMilestoneNum = milestoneMatch
    ? parseInt(milestoneMatch[1], 10)
    : undefined;

  // Use content milestone number if available (more reliable than filename)
  const milestoneNumber = contentMilestoneNum ?? parsed.milestoneNumber;

  // Parse deliverables table
  const deliverables = parseDeliveryTable(content);

  // Check for payment address mentions
  // Some delivery PRs mention a different payment address
  const paymentAddressMatch = content.match(
    /(?:payment|payout)\s*(?:address|to)\s*:?\s*([1-9A-HJ-NP-Za-km-z]{45,48})/i
  );

  return {
    projectSlug: parsed.projectSlug,
    milestoneNumber,
    applicationDocUrl,
    deliverables,
  };
}

function parseDeliveryTable(
  content: string
): ParsedDelivery["deliverables"] {
  const deliverables: ParsedDelivery["deliverables"] = [];
  const lines = content.split("\n");

  let tableStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/\|\s*number\s*\|/i.test(lines[i])) {
      tableStart = i;
      break;
    }
  }

  if (tableStart === -1) return deliverables;

  const dataStart = tableStart + 2;

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) break;

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c !== "");
    if (cells.length < 2) continue;

    const num = cells[0].replace(/\*\*/g, "").replace(/\./g, "").trim();
    const name = cells[1]?.replace(/\*\*/g, "").trim() ?? "";
    const link = cells[2] ?? "";
    const notes = cells[3] ?? "";

    // Extract URL from markdown link
    const linkUrlMatch = link.match(/\[([^\]]*)\]\(([^)]+)\)/);
    const linkUrl = linkUrlMatch ? linkUrlMatch[2] : link.startsWith("http") ? link : undefined;

    if (num) {
      deliverables.push({
        number: num,
        name,
        link: linkUrl,
        notes: notes || undefined,
      });
    }
  }

  return deliverables;
}

/**
 * Parse an evaluation markdown file.
 */
export function parseEvaluationFile(
  content: string,
  filename: string
): ParsedEvaluation | null {
  const parsed = parseEvaluationFilename(filename);
  if (!parsed) return null;

  // Extract status (case-insensitive: "Accepted", "accepted", "ACCEPTED")
  // Handles both **Status:** Value and **Status**: Value
  const statusMatch = content.match(/\*\*Status:?\*\*:?\s*(\w+)/i);
  const statusStr = statusMatch ? statusMatch[1].trim().toLowerCase() : "unknown";
  const status: ParsedEvaluation["status"] =
    statusStr === "accepted"
      ? "accepted"
      : statusStr === "rejected"
        ? "rejected"
        : "unknown";

  // Extract Application Document URL
  const appDocMatch = content.match(
    /\*\*Application Document\*\*:?\s*(?:\[([^\]]*)\]\()?([^)\s]+)/i
  );
  const applicationDocUrl = appDocMatch
    ? appDocMatch[2] || appDocMatch[1]
    : undefined;

  // Parse evaluation deliverables table
  const deliverables = parseEvaluationTable(content);

  return {
    projectSlug: parsed.projectSlug,
    milestoneNumber: parsed.milestoneNumber,
    evaluatorName: parsed.evaluatorName,
    status,
    applicationDocUrl,
    deliverables,
  };
}

function parseEvaluationTable(
  content: string
): ParsedEvaluation["deliverables"] {
  const deliverables: ParsedEvaluation["deliverables"] = [];
  const lines = content.split("\n");

  let tableStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/\|\s*number\s*\|/i.test(lines[i])) {
      tableStart = i;
      break;
    }
  }

  if (tableStart === -1) return deliverables;

  const dataStart = tableStart + 2;

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) break;

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c !== "");
    if (cells.length < 3) continue;

    const num = cells[0].replace(/\*\*/g, "").replace(/\./g, "").trim();
    const name = cells[1]?.replace(/\*\*/g, "").trim() ?? "";
    const acceptedCell = cells[2] ?? "";
    const link = cells[3] ?? "";
    const notes = cells[4] ?? "";

    // Check if accepted: looks for [x] or ☒ in the cell
    const accepted = /\[x\]|☒/i.test(acceptedCell);

    const linkUrlMatch = link.match(/\[([^\]]*)\]\(([^)]+)\)/);
    const linkUrl = linkUrlMatch ? linkUrlMatch[2] : link.startsWith("http") ? link : undefined;

    if (num) {
      deliverables.push({
        number: num,
        name,
        accepted,
        link: linkUrl,
        notes: notes || undefined,
      });
    }
  }

  return deliverables;
}

/**
 * Match a delivery/evaluation file to a grant application slug.
 * Handles naming inconsistencies (hyphens vs underscores, case).
 */
export function normalizeProjectSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
