/**
 * Ecosystem profile matching and deduplication.
 *
 * Dedup priority: githubAccountId (strongest) → github handle → email
 * If githubAccountId matches existing profile, update handle if changed.
 *
 * Enforces exactly one APPLICANT per grantApplicationId.
 */

import type { PrismaClient } from "../../packages/db/generated/client/index.js";
import type { ParsedTeamMember, ParsedContact, GrantSource } from "./types";

const ECOSYSTEM_SOURCE_MAP: Record<GrantSource, string> = {
  w3f: "W3F_GRANTS",
  "open-source": "POLKADOT_OPEN_SOURCE",
  "fast-grants": "FAST_GRANTS",
  "ink-bounty": "W3F_GRANTS",
};

interface ProfileMatchInput {
  member: ParsedTeamMember;
  contact?: ParsedContact;
  githubAccountId?: string;
  isApplicant: boolean;
}

interface MatchedProfile {
  id: string;
  slug: string;
  isNew: boolean;
}

export class EcosystemProfileMatcher {
  private slugCache = new Set<string>();
  private usernameCache = new Set<string>();

  constructor(
    private db: PrismaClient,
    private source: GrantSource,
    private logger: {
      log: (msg: string) => void;
      warn: (msg: string) => void;
    }
  ) {}

  /**
   * Load existing slugs and usernames for collision detection.
   */
  async initialize(): Promise<void> {
    const existingSlugs = await this.db.ecosystemProfile.findMany({
      select: { slug: true },
    });
    for (const p of existingSlugs) {
      this.slugCache.add(p.slug);
    }

    const existingUsernames = await this.db.user.findMany({
      select: { username: true },
      where: { username: { not: null } },
    });
    for (const u of existingUsernames) {
      if (u.username) this.usernameCache.add(u.username.toLowerCase());
    }

    this.logger.log(
      `Loaded ${this.slugCache.size} profile slugs, ${this.usernameCache.size} usernames`
    );
  }

  /**
   * Find or create an EcosystemProfile for a team member.
   * Dedup order: githubAccountId → github handle → email
   */
  async findOrCreate(input: ProfileMatchInput): Promise<MatchedProfile> {
    const { member, contact, githubAccountId, isApplicant } = input;
    const ecosystemSource = ECOSYSTEM_SOURCE_MAP[this.source];

    // 1. Try match by githubAccountId (strongest)
    if (githubAccountId) {
      const existing = await this.db.ecosystemProfile.findFirst({
        where: { githubAccountId },
        select: { id: true, slug: true, github: true },
      });
      if (existing) {
        // Update github handle if it changed
        if (member.github && existing.github !== member.github) {
          await this.db.ecosystemProfile.update({
            where: { id: existing.id },
            data: { github: member.github },
          });
          this.logger.log(
            `Updated GitHub handle for ${existing.slug}: ${existing.github} → ${member.github}`
          );
        }
        return { id: existing.id, slug: existing.slug, isNew: false };
      }
    }

    // 2. Try match by github handle
    if (member.github) {
      const normalized = member.github.toLowerCase().replace(/^@/, "");
      const existing = await this.db.ecosystemProfile.findFirst({
        where: { github: { equals: normalized, mode: "insensitive" } },
        select: { id: true, slug: true },
      });
      if (existing) {
        // Enrich with githubAccountId if we now have it
        if (githubAccountId) {
          await this.db.ecosystemProfile.update({
            where: { id: existing.id },
            data: { githubAccountId },
          });
        }
        return { id: existing.id, slug: existing.slug, isNew: false };
      }
    }

    // 3. Try match by email (contact email for applicant, or member name heuristic)
    const email = isApplicant ? contact?.email : undefined;
    if (email) {
      const existing = await this.db.ecosystemProfile.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true, slug: true },
      });
      if (existing) {
        if (githubAccountId) {
          await this.db.ecosystemProfile.update({
            where: { id: existing.id },
            data: {
              githubAccountId,
              github: member.github || undefined,
            },
          });
        }
        return { id: existing.id, slug: existing.slug, isNew: false };
      }
    }

    // 4. Try match by displayName + source (fallback for profiles without identifiers)
    if (member.name) {
      const existing = await this.db.ecosystemProfile.findFirst({
        where: {
          displayName: { equals: member.name, mode: "insensitive" },
          source: ecosystemSource as any,
        },
        select: { id: true, slug: true },
      });
      if (existing) {
        // Enrich with any new data
        const updates: Record<string, any> = {};
        if (githubAccountId) updates.githubAccountId = githubAccountId;
        if (member.github) updates.github = member.github.toLowerCase().replace(/^@/, "");
        if (isApplicant && contact?.email) updates.email = contact.email.toLowerCase();
        if (Object.keys(updates).length > 0) {
          await this.db.ecosystemProfile.update({
            where: { id: existing.id },
            data: updates,
          });
        }
        return { id: existing.id, slug: existing.slug, isNew: false };
      }
    }

    // 5. No match found — create new profile
    const slug = this.generateSlug(member.name, member.github);
    const normalizedGithub = member.github
      ?.toLowerCase()
      .replace(/^@/, "");

    const profile = await this.db.ecosystemProfile.create({
      data: {
        displayName: member.name,
        slug,
        email: isApplicant ? contact?.email?.toLowerCase() : undefined,
        github: normalizedGithub,
        githubAccountId,
        linkedin: member.linkedin,
        website: isApplicant ? contact?.website : undefined,
        source: ecosystemSource as any,
        sourceData: {
          importSource: this.source,
          role: member.role,
          originalName: member.name,
        },
        contactable: !!(isApplicant && contact?.email),
        outreachStatus: isApplicant && contact?.email ? "PENDING" : null,
      },
    });

    this.slugCache.add(slug);
    this.logger.log(`Created profile: ${slug} (${member.name})`);

    return { id: profile.id, slug, isNew: true };
  }

  /**
   * Create an EcosystemContribution linking a profile to an application.
   * Enforces: exactly one APPLICANT per grantApplicationId.
   */
  async createContribution(
    ecosystemProfileId: string,
    grantApplicationId: string,
    role: "APPLICANT" | "TEAM_MEMBER" | "EVALUATOR" | "CURATOR"
  ): Promise<void> {
    // Check for existing APPLICANT if we're trying to add one
    if (role === "APPLICANT") {
      const existing = await this.db.ecosystemContribution.findFirst({
        where: {
          grantApplicationId,
          role: "APPLICANT",
        },
      });
      if (existing) {
        this.logger.warn(
          `Application ${grantApplicationId} already has an APPLICANT (profile ${existing.ecosystemProfileId}). Skipping duplicate.`
        );
        return;
      }
    }

    // Upsert to handle re-runs
    await this.db.ecosystemContribution.upsert({
      where: {
        ecosystemProfileId_grantApplicationId: {
          ecosystemProfileId,
          grantApplicationId,
        },
      },
      update: { role: role as any },
      create: {
        ecosystemProfileId,
        grantApplicationId,
        role: role as any,
      },
    });
  }

  /**
   * Generate a unique slug for a profile, avoiding collisions with
   * existing User.username and EcosystemProfile.slug values.
   */
  private generateSlug(name: string, github?: string): string {
    // Prefer github handle as slug
    let base = github
      ? github.toLowerCase().replace(/^@/, "")
      : name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

    if (!base || base.length < 2) {
      base = `profile-${Date.now()}`;
    }

    let candidate = base;
    let counter = 0;

    while (
      this.slugCache.has(candidate) ||
      this.usernameCache.has(candidate)
    ) {
      counter++;
      if (counter === 1) {
        // First collision: try source prefix
        candidate = `${this.source}-${base}`;
      } else {
        candidate = `${this.source}-${base}-${counter}`;
      }
    }

    return candidate;
  }
}
