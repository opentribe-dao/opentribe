/**
 * Shared types for the ecosystem grants import pipeline.
 */

export interface ParsedTeamMember {
  name: string;
  role?: string;
  github?: string;
  linkedin?: string;
}

export interface ParsedMilestone {
  number: number;
  title: string;
  estimatedDuration?: string;
  fte?: string;
  costs?: string;
  deliverables: ParsedDeliverable[];
}

export interface ParsedDeliverable {
  number: string; // "0a", "0b", "1", "2", etc.
  name: string;
  specification: string;
}

export interface ParsedContact {
  name?: string;
  email?: string;
  website?: string;
}

export interface ParsedLegalStructure {
  registeredAddress?: string;
  registeredEntity?: string;
}

export interface ParsedResource {
  title: string;
  url: string;
  description?: string;
}

export interface ParsedApplication {
  // From filename
  slug: string;

  // Header fields
  title: string;
  teamName?: string;
  paymentAddress?: string;
  level?: string;

  // Project overview
  tagline?: string;
  description: string;
  summary?: string;

  // Team
  contact: ParsedContact;
  legalStructure?: ParsedLegalStructure;
  teamMembers: ParsedTeamMember[];
  teamExperience?: string;
  teamRepos: string[];

  // Milestones
  totalDuration?: string;
  totalFte?: string;
  totalCosts?: string;
  dotPercentage?: string;
  milestones: ParsedMilestone[];

  // Skills (extracted from description keywords)
  skills: string[];

  // Resources (external links mentioned)
  resources: ParsedResource[];

  // Raw content for fallback
  rawContent: string;
}

export interface ParsedDelivery {
  projectSlug: string;
  milestoneNumber: number;
  applicationDocUrl?: string;
  deliverables: {
    number: string;
    name: string;
    link?: string;
    notes?: string;
  }[];
}

export interface ParsedEvaluation {
  projectSlug: string;
  milestoneNumber: number;
  evaluatorName: string;
  status: "accepted" | "rejected" | "unknown";
  applicationDocUrl?: string;
  deliverables: {
    number: string;
    name: string;
    accepted: boolean;
    link?: string;
    notes?: string;
  }[];
}

export type GrantSource = "w3f" | "open-source" | "fast-grants" | "ink-bounty";

export interface SourceConfig {
  source: GrantSource;
  repoOwner: string;
  repoName: string;
  branch: string;
  applicationsDir: string;
  templateFilename: string;
  orgName: string;
  orgSlug: string;
  grantTitle: string;
  grantExternalId: string;
  fundingSource: "SELF_FUNDED" | "TREASURY";
  ecosystemSource: string;
  /** Has milestone delivery tracking? */
  hasDeliveries: boolean;
  deliveryRepoOwner?: string;
  deliveryRepoName?: string;
}

export const SOURCE_CONFIGS: Record<GrantSource, SourceConfig> = {
  w3f: {
    source: "w3f",
    repoOwner: "w3f",
    repoName: "Grants-Program",
    branch: "master",
    applicationsDir: "applications",
    templateFilename: "application-template.md",
    orgName: "Web3 Foundation",
    orgSlug: "web3-foundation",
    grantTitle: "W3F Grants Program",
    grantExternalId: "w3f:general-grants-program",
    fundingSource: "SELF_FUNDED",
    ecosystemSource: "W3F_GRANTS",
    hasDeliveries: true,
    deliveryRepoOwner: "w3f",
    deliveryRepoName: "Grant-Milestone-Delivery",
  },
  "open-source": {
    source: "open-source",
    repoOwner: "PolkadotOpenSourceGrants",
    repoName: "apply",
    branch: "master",
    applicationsDir: "applications",
    templateFilename: "application-template.md",
    orgName: "Polkadot Open Source Grants",
    orgSlug: "polkadot-open-source-grants",
    grantTitle: "Polkadot Open Source Developer Grants",
    grantExternalId: "polkadot:open-source-grants",
    fundingSource: "TREASURY",
    ecosystemSource: "POLKADOT_OPEN_SOURCE",
    hasDeliveries: false,
  },
  "fast-grants": {
    source: "fast-grants",
    repoOwner: "Polkadot-Fast-Grants",
    repoName: "apply",
    branch: "master",
    applicationsDir: "applications",
    templateFilename: "application-template.md",
    orgName: "Polkadot Fast Grants",
    orgSlug: "polkadot-fast-grants",
    grantTitle: "Polkadot Fast Grants Program",
    grantExternalId: "polkadot:fast-grants",
    fundingSource: "TREASURY",
    ecosystemSource: "FAST_GRANTS",
    hasDeliveries: false,
  },
  "ink-bounty": {
    source: "ink-bounty",
    repoOwner: "use-inkubator",
    repoName: "Ecosystem-Grants",
    branch: "master",
    applicationsDir: "applications",
    templateFilename: "application-template.md",
    orgName: "ink! Smart Contracts Bounty",
    orgSlug: "ink-smart-contracts-bounty",
    grantTitle: "ink! Ecosystem Grants (Wasm Smart Contracts Bounty)",
    grantExternalId: "polkadot:ink-ecosystem-grants",
    fundingSource: "TREASURY",
    ecosystemSource: "W3F_GRANTS", // Uses same format
    hasDeliveries: false,
  },
};
