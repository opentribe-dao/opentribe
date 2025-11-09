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
    version: "Version 1.0.0",
    date: "09 November 2025",
    title: "Major feature release with enhanced functionality",
    description:
      "A major update with new features, comprehensive SEO enhancements, improved branding, and numerous bug fixes to improve platform stability and user experience.",
    items: [
      "Added: Resource file uploads for grants",
      "Added: New Opentribe branding system (logomark, wordmark components)",
      "Added: View tracking and analytics",
      "Added: Empty state components for bounties, grants, RFPs",
      "Added: ShareButton component",
      "Added: Visibility filters for content types",
      "Added: Comprehensive SEO enhancements (OG images, breadcrumbs, sitemap, article schema)",
      "Added: Health check API with detailed responses",
      "Changed: Grant creation flow with stepper navigation and react-hook-form",
      "Changed: Grant editing interface with improved form handling",
      "Changed: Organization switcher functionality",
      "Changed: Dashboard and web app branding",
      "Fixed: Prisma Neon adapter compatibility (Prisma 6.19.0)",
      "Fixed: OG image proportions and metadata alignment",
      "Fixed: Empty state loading logic",
      "Fixed: SEO asset bundling for Vercel",
      "Fixed: Static generation with cookies",
      "Dependencies: Prisma 6.19.0, lucide-react 0.552.0, @biomejs/biome 2.3.2",
    ],
  },
  {
    version: "Version 0.1.0",
    date: "24 October 2025",
    title: "Initial production deployment",
    description:
      "First production release with core platform features, monitoring capabilities, and foundational infrastructure improvements.",
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
              key={index}
              className="relative flex flex-col gap-4 md:flex-row md:gap-16"
            >
              <div className="top-8 flex h-min w-64 shrink-0 items-center gap-4 md:sticky">
                <Badge variant="secondary" className="text-xs">
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
                      <li key={itemIndex} className="list-disc">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {entry.image && (
                  <Image
                    src={entry.image}
                    alt={`${entry.version} visual`}
                    width={800}
                    height={400}
                    className="mt-8 w-full rounded-lg object-cover"
                  />
                )}
                {entry.button && (
                  <Button variant="link" className="mt-4 self-end" asChild>
                    <a
                      href={entry.button.url}
                      target="_blank"
                      rel="noopener noreferrer"
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
