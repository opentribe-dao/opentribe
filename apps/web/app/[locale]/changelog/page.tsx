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
