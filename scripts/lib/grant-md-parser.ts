/**
 * Markdown parser for W3F, Open Source, and Fast Grants applications.
 *
 * Handles format variations across eras and sources:
 * - W3F: evolved header format (Team Name vs Proposer, varying payment address formats)
 * - Fast Grants: emoji headers, no payment address, no level
 * - Open Source Grants: plain headers, detailed budget breakdown
 *
 * All three share the same base template structure (they're forks).
 */

import type {
  ParsedApplication,
  ParsedContact,
  ParsedDeliverable,
  ParsedLegalStructure,
  ParsedMilestone,
  ParsedTeamMember,
} from "./types";

/**
 * Parse a grant application markdown file into structured data.
 */
export function parseGrantApplication(
  content: string,
  filename: string
): ParsedApplication {
  const slug = filename.replace(/\.md$/i, "").toLowerCase();
  const sections = splitIntoSections(content);

  const title = extractTitle(content);
  const headerFields = extractHeaderFields(content);
  const description = extractDescription(sections);
  const summary = extractSummary(sections);
  const contact = extractContact(sections);
  const legalStructure = extractLegalStructure(sections);
  const teamMembers = extractTeamMembers(sections);
  const teamExperience = extractTeamExperience(sections);
  const teamRepos = extractTeamRepos(sections);
  const milestoneOverview = extractMilestoneOverview(sections);
  const milestones = extractMilestones(sections);
  const skills = extractSkills(content);

  return {
    slug,
    title,
    teamName: headerFields.teamName,
    paymentAddress: headerFields.paymentAddress,
    level: headerFields.level,
    tagline: summary,
    description,
    summary,
    contact,
    legalStructure,
    teamMembers,
    teamExperience,
    teamRepos,
    totalDuration: milestoneOverview.totalDuration,
    totalFte: milestoneOverview.totalFte,
    totalCosts: milestoneOverview.totalCosts,
    dotPercentage: milestoneOverview.dotPercentage,
    milestones,
    skills,
    resources: [],
    rawContent: content,
  };
}

// --- Section Splitting ---

interface Section {
  level: number;
  title: string;
  rawTitle: string; // includes emoji
  content: string;
}

function splitIntoSections(content: string): Section[] {
  const lines = content.split("\n");
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let contentLines: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      if (currentSection) {
        currentSection.content = contentLines.join("\n").trim();
        sections.push(currentSection);
      }
      const level = headingMatch[1].length;
      const rawTitle = headingMatch[2].trim();
      const title = normalizeTitle(rawTitle);
      currentSection = { level, title, rawTitle, content: "" };
      contentLines = [];
    } else {
      contentLines.push(line);
    }
  }

  if (currentSection) {
    currentSection.content = contentLines.join("\n").trim();
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Strip emoji (both unicode and GitHub shortcodes) from a title for matching.
 */
function normalizeTitle(title: string): string {
  return title
    .replace(/:[a-z_]+:/g, "") // GitHub emoji shortcodes like :page_facing_up:
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{FE0F}]/gu,
      ""
    ) // Unicode emoji
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // strip markdown links, keep text
    .trim()
    .toLowerCase();
}

function findSection(
  sections: Section[],
  ...titlePatterns: string[]
): Section | undefined {
  return sections.find((s) =>
    titlePatterns.some((p) => s.title.includes(p.toLowerCase()))
  );
}

function findSectionContent(
  sections: Section[],
  ...titlePatterns: string[]
): string {
  return findSection(sections, ...titlePatterns)?.content ?? "";
}

// --- Title ---

function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (!match) return "Untitled";
  // Return the original title (with proper casing), just strip emoji
  return match[1]
    .replace(/:[a-z_]+:/g, "") // GitHub shortcodes
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{FE0F}]/gu,
      ""
    )
    .trim()
    || match[1].trim();
}

// --- Header Fields ---

function extractHeaderFields(content: string): {
  teamName?: string;
  paymentAddress?: string;
  level?: string;
} {
  // Get content before first ## heading
  const preHeading = content.split(/^##\s/m)[0] || "";

  const teamName =
    extractBulletValue(preHeading, "team name") ||
    extractBulletValue(preHeading, "proposer");

  const paymentAddress =
    extractBulletValue(preHeading, "payment address") ||
    extractBulletValue(preHeading, "payment details");

  const level = extractBulletValue(preHeading, "level");

  return { teamName, paymentAddress, level };
}

/**
 * Extract a bold key-value from a markdown bullet list.
 * Handles: `- **Key:** Value`, `* **Key:** Value`, `- **[Key](url):** Value`
 */
function extractBulletValue(
  text: string,
  key: string
): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `^\\s*[-*]\\s+\\*\\*\\[?${escaped}\\]?(?:\\([^)]*\\))?:?\\*\\*:?\\s*(.+)$`,
    "im"
  );
  const match = text.match(pattern);
  if (!match) return undefined;
  const value = match[1].trim();
  return value || undefined;
}

// --- Description ---

function extractDescription(sections: Section[]): string {
  // Try "Project Details" first, then "Overview" under "Project Overview"
  const details = findSectionContent(sections, "project details");
  if (details) return details;

  const overview = findSectionContent(sections, "overview");
  return overview || "";
}

function extractSummary(sections: Section[]): string | undefined {
  // The tagline/one-sentence summary is usually the first bullet point in Overview
  const overview = findSectionContent(sections, "project overview", "overview");
  if (!overview) return undefined;

  // Try to find tagline bullet
  const taglineMatch = overview.match(
    /[-*]\s+\*\*(?:tagline|one-line|one sentence)[^*]*\*\*:?\s*(.+)/i
  );
  if (taglineMatch) return taglineMatch[1].trim();

  // Fall back to first non-empty paragraph
  const firstPara = overview
    .split("\n\n")
    .find((p) => p.trim() && !p.trim().startsWith("-") && !p.trim().startsWith("*"));
  if (firstPara && firstPara.length < 500) return firstPara.trim();

  return undefined;
}

// --- Contact Info ---

function extractContact(sections: Section[]): ParsedContact {
  const contactSection = findSectionContent(sections, "contact");
  // Also check the team section header area (Fast Grants puts contact inline)
  const teamSection = findSectionContent(sections, "team");
  const searchText = contactSection || teamSection;

  return {
    name:
      extractBulletValue(searchText, "contact name") ||
      extractBulletValue(searchText, "name"),
    email:
      extractBulletValue(searchText, "contact email") ||
      extractBulletValue(searchText, "email"),
    website:
      extractBulletValue(searchText, "website") ||
      extractBulletValue(searchText, "web"),
  };
}

// --- Legal Structure ---

function extractLegalStructure(
  sections: Section[]
): ParsedLegalStructure | undefined {
  const legal = findSectionContent(sections, "legal structure");
  if (!legal) return undefined;

  return {
    registeredAddress: extractBulletValue(legal, "registered address"),
    registeredEntity:
      extractBulletValue(legal, "registered legal entity") ||
      extractBulletValue(legal, "legal entity"),
  };
}

// --- Team Members ---

function extractTeamMembers(sections: Section[]): ParsedTeamMember[] {
  const members: Map<string, ParsedTeamMember> = new Map();

  // Parse "Team members" section specifically (not the parent "Team" section)
  const teamMembersSection = findSection(sections, "team members");
  // Fall back to the main "Team" section if no "Team members" subsection
  const teamSection = teamMembersSection || findSection(sections, "team");
  if (teamSection) {
    parseTeamMembersList(teamSection.content, members);
  }

  // Enrich with GitHub handles from "Team Code Repos"
  const reposContent = findSectionContent(sections, "team code repos", "code repos");
  if (reposContent) {
    enrichWithGitHub(reposContent, members);
  }

  // Enrich with LinkedIn from "Team LinkedIn Profiles"
  const linkedinContent = findSectionContent(
    sections,
    "linkedin profiles",
    "linkedin"
  );
  if (linkedinContent) {
    enrichWithLinkedIn(linkedinContent, members);
  }

  return Array.from(members.values());
}

/** Lines that are section headers or descriptive text, not team member names */
const JUNK_LINE_PATTERNS = [
  /^team(?:'s)?\s+(?:members?|experience|code\s*repos?|website|linkedin|github)/i,
  /^code\s*repos?$/i,
  /^experience$/i,
  /^linkedin\s*profiles?/i,
  /^github\s*(?:profiles?|accounts?)?$/i,
  /^please\s+also/i,
  /^note:/i,
  /^names?\s+of\s+team/i,
  /^dev\s+team\s+members/i,
  /^team\s+website/i,
  /^(?:fontend|frontend|backend)\s+developer\s+team/i,
  /^(?:code\s*)?repos?$/i,
  /^experience$/i,
  /^website$/i,
  /^members$/i,
  /^open[- ]source\s+code\s*repos?$/i,
  /^team\s+lead(?:er)?s?$/i,
  /^\w+\s+dev\s+team$/i,
  /^\w+\s+team\s+members?\s+including/i,
  /^\d+(?:\.\d+)?\s*x\s+/i, // "0.5 x Project Manager", "2 x Engineers"
  /^\(development/i,
  /^02-6\d{2}\s+warsaw/i, // Address lines
  /^\d{2,5}\s+\w+,\s*\w+/i, // Generic addresses
  /^the\s+team\s+/i,
  /^our\s+team\s+/i,
  /^we\s+(have|are|will)/i,
  /^(?:discord|telegram|email|twitter|medium|element|signal|matrix|slack|riot)$/i, // Contact channels, not people
  /^(?:team\s*name|team\s*repos?|accounts?|organisation|founder|--+|\(personal\))$/i, // Placeholder entries
  /^[a-g]\.\s+(?:contact|website|linkedin|email|github|telegram)/i, // Lettered list items (a. Contact Email, g. LinkedIn)
];

function isJunkTeamLine(line: string): boolean {
  const lower = line.toLowerCase().replace(/\*\*/g, "").trim();
  return JUNK_LINE_PATTERNS.some((p) => p.test(lower));
}

/** Strip emoji prefixes from names (👨‍💻, 👩‍💼, etc.) */
function stripEmoji(str: string): string {
  return str
    .replace(
      /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{FE0F}\u{2060}]+/gu,
      ""
    )
    .trim();
}

/** Clean a parsed name: strip emoji, remove trailing role in parens/brackets, trim */
function cleanParsedName(name: string): string {
  let cleaned = stripEmoji(name);
  // Remove "(Github)", "(Github / Website)", "(Team Lead)", etc.
  cleaned = cleaned.replace(/\s*\((?:Github|GitHub|Website|Team\s*Lead(?:er)?|CEO|CTO|COO|CFO)[\s/]*(?:Github|GitHub|Website)?\)\s*$/i, "");
  // Remove "Linkedin GitHub" suffix
  cleaned = cleaned.replace(/\s+(?:Linkedin|LinkedIn)\s+(?:GitHub|Github)\s*$/i, "");
  // Handle em-dash role: "Name – Role" or "Name — Role"
  cleaned = cleaned.replace(/\s*[–—]\s+(?:CEO|CTO|COO|CFO|Lead|Manager|Developer|Engineer|Architect|Founder|Director|Design|Product).*$/i, "");
  // Remove trailing periods
  cleaned = cleaned.replace(/\.\s*$/, "").trim();
  // Remove "Mr.", "Mrs.", "Dr." prefix but keep the name
  // (already handled in parseTeamMemberLine)
  return cleaned;
}

function parseTeamMembersList(
  content: string,
  members: Map<string, ParsedTeamMember>
): void {
  const lines = content.split("\n");

  for (const rawLine of lines) {
    // Accept both bullet lines and plain text lines (W3F uses both)
    const isBullet = /^\s*[-*]\s/.test(rawLine);
    const cleaned = isBullet
      ? rawLine.replace(/^\s*[-*]\s+/, "").trim()
      : rawLine.trim();

    if (!cleaned) continue;
    // Skip lines that are clearly not team members
    if (cleaned.startsWith("http") && !cleaned.includes(" ")) continue;
    if (cleaned.startsWith("#")) continue;
    if (cleaned.startsWith("|")) continue;
    if (cleaned.startsWith("```")) continue;
    if (cleaned.startsWith(">")) continue;
    if (cleaned.length < 3 || cleaned.length > 200) continue;
    // Skip bold key-value lines (Contact Name, Email, etc.)
    if (/^\*\*(?:Contact|Registered|Website|Email|Legal)[^*]*\*\*/.test(cleaned)) continue;
    // Skip section headers that get parsed as names
    if (isJunkTeamLine(cleaned)) continue;

    // Try: "Role: Name URL" or "Name: Role URL" or "Name - Role. University"
    const member = parseTeamMemberLine(cleaned);
    if (member && member.name) {
      const key = member.name.toLowerCase();
      const existing = members.get(key);
      if (existing) {
        // Merge: keep existing fields, add new ones
        if (member.role && !existing.role) existing.role = member.role;
        if (member.github && !existing.github) existing.github = member.github;
      } else {
        members.set(key, member);
      }
    }
  }
}

function parseTeamMemberLine(line: string): ParsedTeamMember | null {
  let github: string | undefined;
  let linkedin: string | undefined;

  // Extract GitHub from various formats:
  // [GitHub: handle](url), [Github](url), [handle](github-url), bare github url
  const ghPatterns = [
    /\[(?:GitHub|Github):?\s*([a-zA-Z0-9_-]+)\]\(https?:\/\/github\.com\/\1\)/i,
    /\[([^\]]+)\]\(https?:\/\/github\.com\/([a-zA-Z0-9_-]+)\)/,
    /\[?https?:\/\/github\.com\/([a-zA-Z0-9_-]+)\]?/,
  ];
  for (const pattern of ghPatterns) {
    const m = line.match(pattern);
    if (m) {
      github = m[2] || m[1];
      break;
    }
  }

  // Extract LinkedIn
  const liMatch = line.match(
    /\[([^\]]*)\]\((https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s)]+)\)/
  );
  if (liMatch) {
    linkedin = liMatch[2];
  }

  // Strip all markdown links and URLs for name extraction
  let nameStr = line
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // [text](url) → text
    .replace(/https?:\/\/\S+/g, "") // bare URLs
    .replace(/\*\*/g, "") // bold markers
    .replace(/：/g, ":") // fullwidth colon
    .trim();

  // Remove common non-name prefixes
  nameStr = nameStr
    .replace(/^GitHub:?\s*/i, "")
    .replace(/^Github\s*/i, "")
    .replace(/^Linkdin\s*/i, "")
    .replace(/^LinkedIn\s*/i, "")
    .trim();

  let name: string | undefined;
  let role: string | undefined;

  // Pattern 1: "Role, Subrole: Name Details" — "Team Leader, Founder: Eugene Fine https://..."
  const roleNameMatch = nameStr.match(
    /^([A-Z][^:]{3,40}):\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})/
  );

  // Pattern 2: "Name - Role details" — "Han Zhao - Core Dev and PM of Litentry"
  // Also handles "Dr. John Wu - Core Dev" and "Katarína Valová - Core developer"
  const nameDashRoleMatch = nameStr.match(
    /^((?:Dr\.\s+)?[A-Z\u00C0-\u024F][a-zA-Z\u00C0-\u024F]+(?:\s+[A-Z\u00C0-\u024F][a-zA-Z\u00C0-\u024F]+){0,3})\s+-\s+(.+)/
  );

  // Pattern 3: "Name : Role" or "Name: Role" — "Sam Zou: Project manager"
  const nameColonRoleMatch = nameStr.match(
    /^((?:Dr\.\s+)?[A-Z\u00C0-\u024F][a-zA-Z\u00C0-\u024F]+(?:\s+[A-Z\u00C0-\u024F][a-zA-Z\u00C0-\u024F]+){0,3})\s*:\s*(.+)/
  );

  if (nameDashRoleMatch) {
    // Prefer "Name - Role" pattern (most common in W3F apps)
    name = nameDashRoleMatch[1].trim();
    role = nameDashRoleMatch[2].trim();
  } else if (roleNameMatch && !nameColonRoleMatch) {
    // "Role: Name" only if it's not "Name: Role"
    role = roleNameMatch[1].trim();
    name = roleNameMatch[2].trim();
  } else if (nameColonRoleMatch) {
    name = nameColonRoleMatch[1].trim();
    role = nameColonRoleMatch[2].trim();
  } else {
    // Just a name, possibly with trailing junk
    name = nameStr
      .replace(/[,;:]+$/, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  // Clean up name
  if (name) {
    name = cleanParsedName(name);
    name = name.replace(/^\*+|\*+$/g, "").trim();

    // Split "Name, Role" — "Aaron Chen, CTO" → name="Aaron Chen", role="CTO"
    const commaRole = name.match(
      /^([A-Z\u00C0-\u024F][a-zA-Z\u00C0-\u024F]+(?:\s+[A-Z\u00C0-\u024F][a-zA-Z\u00C0-\u024F]+){0,3}),\s+(.+)/
    );
    if (commaRole && !role) {
      const possibleRole = commaRole[2].trim();
      // Only split if the part after comma looks like a role (contains role keywords)
      if (/(?:CEO|CTO|COO|CFO|Lead|Manager|Developer|Engineer|Architect|Founder|Director|Head|VP|Designer|Researcher)/i.test(possibleRole)) {
        name = commaRole[1].trim();
        role = possibleRole;
      }
    }

    // Split "Name (Role)" — "Abdul Hakim (Blockchain Developer)" → name="Abdul Hakim"
    const parenRole = name.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (parenRole && !role) {
      const inner = parenRole[2].trim();
      if (/(?:Developer|Engineer|Lead|Manager|Founder|Designer|Researcher|team)/i.test(inner)) {
        name = parenRole[1].trim();
        role = inner;
      }
    }

    // Truncate at first sentence-ending period followed by space+uppercase (role description leak)
    const periodSplit = name.match(/^(.+?)\.\s+[A-Z]/);
    if (periodSplit && periodSplit[1].length >= 3) {
      const wordCount = periodSplit[1].split(/\s+/).length;
      if (wordCount <= 5) {
        name = periodSplit[1].trim();
      }
    }

    // Final cleanup
    name = name.replace(/\.\s*$/, "").trim(); // trailing period
    name = name.replace(/\s*<br\s*\/?>.*$/i, "").trim(); // HTML breaks

    if (name.length < 2 || name.length > 60) return null;
    // Skip lines that are clearly not names
    if (/^(http|github|linkedin|none|n\/a|tbd|please|note|the\s|our\s|we\s)/i.test(name)) return null;
    // Skip exact section header words
    const nameLower = name.toLowerCase();
    if (["code repos", "experience", "members", "website", "team lead", "team leader", "team leaders",
         "open-source code repos", "team website", "team members"].includes(nameLower)) return null;
    // Skip lines with "team" that are descriptions not names
    if (/^.*\bteam\b.*$/i.test(name) && !/^[A-Z][a-z]+\s+[A-Z]/.test(name)) return null;
    // Skip lines that look like descriptions (too many words)
    const words = name.split(/\s+/);
    if (words.length > 5) return null;
    // Skip lines that are clearly org/team descriptions
    if (/(?:'s development|'s QA|division|department)/i.test(name)) return null;
  }

  if (!name) return null;

  return { name, role, github, linkedin };
}

function enrichWithGitHub(
  content: string,
  members: Map<string, ParsedTeamMember>
): void {
  // Look for "[Name](https://github.com/handle)" patterns
  const linkPattern =
    /\[([^\]]+)\]\(https?:\/\/github\.com\/([a-zA-Z0-9_-]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(content)) !== null) {
    const linkName = match[1].trim().toLowerCase();
    const handle = match[2];

    for (const [key, member] of members) {
      if (
        key.includes(linkName) ||
        linkName.includes(key) ||
        linkName === handle.toLowerCase()
      ) {
        member.github = member.github || handle;
        break;
      }
    }
  }

  // "https://github.com/h4n0 Han Zhao" — bare URL followed by name
  const bareWithNamePattern =
    /[-*]?\s*https?:\/\/github\.com\/([a-zA-Z0-9_-]+)\s+(.+)/gm;
  while ((match = bareWithNamePattern.exec(content)) !== null) {
    const handle = match[1];
    const nameStr = match[2].trim().toLowerCase();

    for (const [key, member] of members) {
      if (key.includes(nameStr) || nameStr.includes(key)) {
        member.github = member.github || handle;
        break;
      }
    }
  }

  // Bare GitHub URLs without names — try matching handle to member names
  const barePattern =
    /[-*]\s+https?:\/\/github\.com\/([a-zA-Z0-9_-]+)\s*$/gm;
  while ((match = barePattern.exec(content)) !== null) {
    const handle = match[1].toLowerCase();
    // Try to match handle substring to a member name
    for (const [, member] of members) {
      if (!member.github) {
        const nameParts = member.name.toLowerCase().split(/\s+/);
        if (nameParts.some((part) => handle.includes(part) || part.includes(handle))) {
          member.github = match[1];
          break;
        }
      }
    }
  }
}

function enrichWithLinkedIn(
  content: string,
  members: Map<string, ParsedTeamMember>
): void {
  // "[Name](linkedin URL)" pattern
  const linkPattern =
    /\[([^\]]+)\]\((https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(content)) !== null) {
    const linkName = match[1].trim().toLowerCase();
    const url = match[2];

    for (const [key, member] of members) {
      if (key.includes(linkName) || linkName.includes(key)) {
        member.linkedin = member.linkedin || url;
        break;
      }
    }
  }

  // Bare LinkedIn URLs
  const barePattern =
    /[-*]\s+(https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s]+)/gm;
  while ((match = barePattern.exec(content)) !== null) {
    // Can't match to name from bare URL alone
  }
}

// --- Team Repos ---

function extractTeamRepos(sections: Section[]): string[] {
  const content = findSectionContent(
    sections,
    "team code repos",
    "code repos"
  );
  if (!content) return [];

  const repos: string[] = [];
  const urlPattern = /https?:\/\/github\.com\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)?/g;
  let match: RegExpExecArray | null;
  while ((match = urlPattern.exec(content)) !== null) {
    repos.push(match[0]);
  }

  return [...new Set(repos)];
}

function extractTeamExperience(sections: Section[]): string | undefined {
  const content = findSectionContent(
    sections,
    "team's experience",
    "team experience"
  );
  return content || undefined;
}

// --- Milestones ---

function extractMilestoneOverview(sections: Section[]): {
  totalDuration?: string;
  totalFte?: string;
  totalCosts?: string;
  dotPercentage?: string;
} {
  // The overview is usually right under "Development Roadmap" → "Overview"
  // or as bullet points before the first milestone heading
  const roadmap = findSectionContent(sections, "development roadmap");
  const overview = findSectionContent(sections, "overview");
  const searchText = overview || roadmap || "";

  return {
    totalDuration:
      extractBulletValue(searchText, "total estimated duration") ||
      extractBulletValue(searchText, "estimated duration"),
    totalFte:
      extractBulletValue(searchText, "full-time equivalent") ||
      extractBulletValue(searchText, "fte"),
    totalCosts:
      extractBulletValue(searchText, "total costs") ||
      extractBulletValue(searchText, "costs"),
    dotPercentage: extractBulletValue(searchText, "dot %"),
  };
}

function extractMilestones(sections: Section[]): ParsedMilestone[] {
  const milestones: ParsedMilestone[] = [];

  // Find all milestone sections
  const milestoneSections = sections.filter(
    (s) =>
      /milestone\s*\d/i.test(s.title) ||
      /milestone\s*#?\s*\d/i.test(s.rawTitle)
  );

  for (const section of milestoneSections) {
    const numMatch = section.rawTitle.match(/milestone\s*#?\s*(\d+)/i);
    if (!numMatch) continue;

    const number = parseInt(numMatch[1], 10);
    const titleMatch = section.rawTitle.match(
      /milestone\s*#?\s*\d+\s*[-—:]\s*(.+)/i
    );
    const title = titleMatch
      ? titleMatch[1].replace(/:[a-z_]+:|[\u{1F300}-\u{1FAFF}]/gu, "").trim()
      : `Milestone ${number}`;

    const content = section.content;

    // Extract milestone-level fields
    const estimatedDuration =
      extractBulletValue(content, "estimated duration") ||
      extractBulletValue(content, "duration");
    const fte = extractBulletValue(content, "fte");
    const costs =
      extractBulletValue(content, "costs") ||
      extractBulletValue(content, "cost");

    // Extract deliverables table
    const deliverables = extractDeliverablesTable(content);

    milestones.push({
      number,
      title,
      estimatedDuration,
      fte,
      costs,
      deliverables,
    });
  }

  return milestones;
}

function extractDeliverablesTable(content: string): ParsedDeliverable[] {
  const deliverables: ParsedDeliverable[] = [];
  const lines = content.split("\n");

  // Find the table header line (contains "Number" and "Deliverable")
  let tableStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/\|\s*number\s*\|/i.test(lines[i])) {
      tableStart = i;
      break;
    }
  }

  if (tableStart === -1) return deliverables;

  // Skip header and separator lines
  const dataStart = tableStart + 2;

  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) break; // End of table

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c !== "");
    if (cells.length < 3) continue;

    const num = cells[0]
      .replace(/\*\*/g, "")
      .replace(/\./g, "")
      .trim();
    const name = cells[1].replace(/\*\*/g, "").trim();
    const spec = cells.slice(2).join(" | ").trim(); // Remaining columns as spec

    if (num && name) {
      deliverables.push({ number: num, name, specification: spec });
    }
  }

  return deliverables;
}

// --- Skills Extraction ---

const SKILL_KEYWORDS: Record<string, string[]> = {
  rust: ["rust", "substrate", "frame", "pallet"],
  solidity: ["solidity", "evm", "smart contract"],
  typescript: ["typescript", "ts"],
  javascript: ["javascript", "js", "node.js", "nodejs"],
  react: ["react", "next.js", "nextjs"],
  python: ["python"],
  "zero-knowledge": ["zero-knowledge", "zk-snark", "zk-stark", "zkp"],
  cryptography: ["cryptography", "encryption", "decryption"],
  identity: ["identity", "did", "ssi", "self-sovereign"],
  privacy: ["privacy", "confidential"],
  defi: ["defi", "decentralized finance", "amm", "dex", "lending"],
  governance: ["governance", "voting", "opengov"],
  "cross-chain": ["cross-chain", "xcm", "bridge", "interoperability"],
  ink: ["ink!", "ink smart contract"],
  polkadot: ["polkadot", "substrate", "parachain", "relay chain"],
  kusama: ["kusama"],
  wasm: ["wasm", "webassembly", "polkavm"],
  infrastructure: ["infrastructure", "rpc", "indexer", "explorer"],
  tooling: ["tooling", "sdk", "cli", "developer tools"],
  nft: ["nft", "non-fungible"],
  dao: ["dao", "decentralized autonomous"],
  data: ["data", "analytics", "indexing", "subquery", "subsquid"],
};

function extractSkills(content: string): string[] {
  const lowerContent = content.toLowerCase();
  const skills: string[] = [];

  for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
    if (keywords.some((kw) => lowerContent.includes(kw))) {
      skills.push(skill);
    }
  }

  return skills;
}
