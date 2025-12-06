import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import { getDictionary } from "@packages/i18n";
import { createSiteMetadata } from "@packages/seo/meta";
import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

// Define the ChangelogEntry type
export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  description: string;
  items?: string[];
  image?: string;
  button?: {
    url: string;
    text: string;
  };
};

// Sample changelog entries
const changelogEntries: ChangelogEntry[] = [
  {
    version: "Version 1.2.0",
    date: "29 November 2025",
    title: "Curator Management & Bounty Submissions",
    description:
      "This release introduces a comprehensive multiple curator management system with role-based permissions, complete bounty submission CRUD operations with attachment handling, boolean screening questions, documentation site enhancements, and automated Discord release notifications.",
    items: [
      "Added: Multiple curator support with invite, accept, and remove functionality",
      "Added: Curator role-based permissions (editing restrictions on closed/completed bounties)",
      "Added: Enhanced curator contact options in bounty detail pages",
      "Added: Complete bounty submission CRUD operations with edit mode support",
      "Added: Attachment handling in submissions with URL validation and file naming",
      "Added: Position assignment for bounty submissions with ranking support",
      "Added: Boolean type for screening questions in bounties",
      "Added: Footer component for documentation site",
      "Added: Discord release notification automation in CI/CD pipeline",
      "Added: Analytics and Sentry wiring for documentation site",
      "Changed: Improved organization membership validation for submissions",
      "Changed: Enhanced screening validation with boolean normalization",
      "Changed: Streamlined curator API routes with better error handling",
      "Changed: Bounty settings form validation before save",
      "Changed: Updated contact button labels for clarity in bounty pages",
      "Fixed: Header mobile and user menu click-outside closing logic",
      "Fixed: Screening answer persistence in submission flow",
      "Fixed: Zod validation error handling refactored for consistency",
      "Fixed: Sentry initialization made optional for docs (only when DSN configured)",
      "Infrastructure: Curator permissions test suite with comprehensive coverage",
      "Infrastructure: Position assignment tests and enhanced position handling logic",
      "Infrastructure: Organization auth enhancements for bounty and submission handling",
    ],
    button: {
      url: "/blog/v1-2-0-curator-management-bounty-submissions",
      text: "Read the full announcement",
    },
  },
  {
    version: "Version 1.1.0",
    date: "18 November 2025",
    title: "Organization Enhancements & Bounty Improvements",
    description:
      "This release introduces comprehensive organization profile enhancements with location, type, and industry fields, organization-based API routes for bounties and grants, improved bounty system with visibility filters and enhanced display, along with various UX improvements and bug fixes across the platform.",
    items: [
      "Added: Organization location, type, and industry fields in settings",
      "Added: Visibility filter (Draft, Published, Archived) for bounties page",
      "Added: NoOrganizationFallback component for improved empty state handling",
      "Added: Resources block display in bounty detail pages",
      "Added: Comment counts on bounty cards",
      "Added: Skill category headings for better organization",
      "Added: Sign-in and sign-up redirect support for improved authentication flow",
      "Added: Organization-based API routes (/api/v1/organizations/[id]/bounties and /api/v1/organizations/[id]/grants)",
      "Changed: Email validation refactored to use z.email() for consistency",
      "Changed: RFP status 'COMPLETED' renamed to 'Paused' with updated styling",
      "Changed: Removed slug display from RFPs page for cleaner presentation",
      "Changed: Enhanced bounty card display with mobile-optimized truncation",
      "Changed: Improved signup success message for better clarity",
      "Changed: Better loading and empty state handling across Grants and RFPs pages",
      "Changed: Organization settings UI with enhanced form handling and validation",
      "Fixed: Organization profile update issues with proper field mapping",
      "Fixed: Sentry client initialization with configurable feedback option",
      "Fixed: Safer screening checks in bounty components",
      "Infrastructure: Comprehensive authorization and permission system for organization operations",
      "Infrastructure: New organization-auth utility for role-based access control",
      "Infrastructure: Enhanced API middleware with request logging and CORS handling",
      "Infrastructure: Skill metadata improvements with getSkillHeading helper function",
      "Infrastructure: Updated tests for organization-based bounty and grant routes",
    ],
  },
  {
    version: "Version 1.0.1",
    date: "17 November 2025",
    title: "Email & Documentation Enhancements - Bug Fixes & Improvements",
    description:
      "This release focuses on email template improvements with dark mode support, documentation site enhancements, and various bug fixes and infrastructure updates.",
    items: [
      "Added: Dark mode support for email templates (BaseTemplate and PaymentConfirmationEmail)",
      "Changed: Replaced SVG logo with Img component in emails for improved rendering",
      "Changed: Enhanced documentation site layout with Open Graph support",
      "Changed: Refined global CSS for improved aesthetics",
      "Changed: Removed API overview references from documentation",
      "Infrastructure: Documentation site improvements and content updates",
    ],
  },
  {
    version: "Version 1.0.0",
    date: "11 November 2025",
    title: "Platform Launch - Production Ready",
    description:
      "First production release of Opentribe with legal compliance, enhanced features, and comprehensive improvements. This release includes GDPR cookie consent, contact & support system, grant management enhancements, SEO improvements, and full CI/CD deployment pipeline.",
    items: [
      "Added: Cookie consent banner with GDPR compliance and privacy controls",
      "Added: Legal pages (Privacy Policy, Terms of Service, Cookie Policy)",
      "Added: Contact form and support page with email integration",
      "Added: Resource file uploads for grants",
      "Added: Share functionality for bounties, grants, and RFPs",
      "Added: View tracking and analytics system",
      "Added: Empty state components for better UX",
      "Added: New Opentribe branding (logomark, wordmark, PWA icons)",
      "Changed: Refreshed all 17 transactional email templates",
      "Changed: Complete grant management workflow with stepper navigation",
      "Changed: Comprehensive SEO enhancements (OG images, breadcrumbs, sitemap)",
      "Changed: Enhanced organization switcher functionality",
      "Fixed: Authentication and redirect issues",
      "Fixed: Static generation with cookies",
      "Fixed: OG image assets for Vercel production",
      "Fixed: API visibility filtering",
      "Infrastructure: Prisma 6.19.0, Sentry monitoring, PostHog analytics",
      "Infrastructure: Multi-project CI/CD deployment pipeline",
      "Infrastructure: Ultracite linting v6.3.2, repo-wide formatting",
    ],
  },
  {
    version: "Version 0.1.0",
    date: "24 October 2025",
    title: "Initial Beta Release",
    description:
      "First production deployment with core platform features, monitoring capabilities, and foundational infrastructure improvements.",
    items: [
      "Sentry integration and monitoring",
      "Next.js upgrade to 15.5.6",
      "Dashboard and web component refactoring for SEO",
      "Exchange rate USD conversion",
      "Dependency updates (recharts, lucide-react, posthog, etc.)",
      "Development environment configuration improvements",
    ],
  },
];

type ChangelogProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: ChangelogProps): Promise<Metadata> => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return createSiteMetadata({
    title: dictionary.seo.changelog.title,
    description: dictionary.seo.changelog.description,
    keywords: dictionary.seo.changelog.keywords,
    image: "/api/og?title=Changelog",
  });
};

const Changelog = async ({ params }: ChangelogProps) => {
  const { locale } = await params;
  await getDictionary(locale);

  return (
    <section className="px-8 py-16">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-4 font-bold text-3xl tracking-tight md:text-5xl">
            Changelog
          </h1>
          <p className="mb-6 text-base text-muted-foreground md:text-lg">
            Stay informed about the latest product improvements and updates.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-3xl space-y-16 md:mt-24 md:space-y-24">
          {changelogEntries.map((entry, index) => (
            <div
              className="relative flex flex-col gap-4 md:flex-row md:gap-16"
              key={index}
            >
              <div className="top-8 flex h-min w-64 shrink-0 items-center gap-4 md:sticky">
                <Badge className="text-xs" variant="secondary">
                  {entry.version}
                </Badge>
                <span className="font-medium text-muted-foreground text-xs">
                  {entry.date}
                </span>
              </div>
              <div className="flex flex-col">
                <h2 className="mb-3 font-bold text-foreground/90 text-lg leading-tight md:text-2xl">
                  {entry.title}
                </h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  {entry.description}
                </p>
                {entry.items && entry.items.length > 0 && (
                  <ul className="mt-4 ml-4 space-y-1.5 text-muted-foreground text-sm md:text-base">
                    {entry.items.map((item, itemIndex) => (
                      <li className="list-disc" key={itemIndex}>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {entry.image && (
                  <Image
                    alt={`${entry.version} visual`}
                    className="mt-8 w-full rounded-lg object-cover"
                    height={400}
                    src={entry.image}
                    width={800}
                  />
                )}
                {entry.button && (
                  <Button asChild className="mt-4 self-end" variant="link">
                    <a
                      href={entry.button.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {entry.button.text} <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Changelog;
