import { getDictionary } from "@packages/i18n";
import { createSiteMetadata } from "@packages/seo/meta";
import {
  BookOpen,
  FileText,
  HelpCircle,
  Mail,
  MessageCircle,
  Users,
} from "lucide-react";
import type { Metadata } from "next";

type SupportProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: SupportProps): Promise<Metadata> => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return createSiteMetadata({
    title: dictionary.seo.support.title,
    description: dictionary.seo.support.description,
    keywords: dictionary.seo.support.keywords,
    image: "/api/og?title=Support",
  });
};

const Support = async ({ params }: SupportProps) => {
  const { locale } = await params;
  await getDictionary(locale);

  const supportChannels = [
    {
      icon: BookOpen,
      title: "Documentation",
      description:
        "Comprehensive guides and tutorials for using Opentribe effectively.",
      link: process.env.NEXT_PUBLIC_DOCS_URL || "https://docs.opentribe.io",
      linkText: "View Docs",
      external: true,
    },
    {
      icon: MessageCircle,
      title: "Community",
      description:
        "Join our community to connect with other builders and get help from peers.",
      link: "https://discord.gg/opentribe",
      linkText: "Join Discord",
      external: true,
    },
    {
      icon: Mail,
      title: "Email Support",
      description:
        "Contact our support team directly for help with your account or questions.",
      link: "mailto:support@opentribe.io",
      linkText: "support@opentribe.io",
      external: false,
    },
  ];

  const builderResources = [
    {
      title: "Applying to Grants",
      description: "Learn how to write strong grant applications",
      topics: [
        "Understanding grant requirements",
        "Writing effective proposals",
        "Tracking application status",
        "Communicating with grant programs",
      ],
    },
    {
      title: "Submitting to Bounties",
      description: "Best practices for bounty submissions",
      topics: [
        "Reading bounty requirements carefully",
        "Submitting original work",
        "Meeting deadlines",
        "Understanding payment processes",
      ],
    },
    {
      title: "Profile & Account",
      description: "Managing your Opentribe account",
      topics: [
        "Completing your profile",
        "Showcasing your skills",
        "Connecting wallets",
        "Account security",
      ],
    },
  ];

  const organizationResources = [
    {
      title: "Listing Opportunities",
      description: "Get your opportunities featured on Opentribe",
      topics: [
        "Submitting opportunities for approval",
        "Writing clear requirements",
        "Best practices for opportunity descriptions",
        "Managing visibility",
      ],
    },
    {
      title: "Managing Applications",
      description: "Review and manage submissions effectively",
      topics: [
        "Reviewing applications fairly",
        "Communicating with applicants",
        "Providing constructive feedback",
        "Selecting winners",
      ],
    },
    {
      title: "Team Management",
      description: "Working with your organization team",
      topics: [
        "Inviting team members",
        "Managing roles and permissions",
        "Organization settings",
        "Billing and plans",
      ],
    },
  ];

  const commonQuestions = [
    {
      question: "How do I contact opportunity creators?",
      answer:
        "Opentribe aggregates opportunities from across the Polkadot ecosystem. For questions about specific opportunities, grants, or bounties, please contact the opportunity creator directly (listed on each opportunity page). For Polkadot Grants, visit the official Polkadot Grant Program website.",
    },
    {
      question: "Who handles payments for bounties and grants?",
      answer:
        "All payments are the sole responsibility of opportunity creators (Polkadot Treasury, Organizations, DAOs). Opentribe does not process, hold, or guarantee payments. We are an aggregator platform.",
    },
    {
      question: "How long does it take to get a response?",
      answer:
        "Critical issues: 24 hours | General inquiries: 48-72 hours | Feature requests: 1-2 weeks",
    },
    {
      question: "What are your office hours?",
      answer:
        "Monday-Friday, 10 AM - 6 PM IST. We are a small team funded by Polkadot grants!",
    },
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 font-bold text-4xl tracking-tight md:text-6xl">
            How Can We Help?
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Find answers, get support, and connect with the Opentribe community
          </p>
        </div>

        {/* Support Channels */}
        <div className="mb-16">
          <h2 className="mb-8 text-center font-semibold text-2xl">
            Support Channels
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {supportChannels.map((channel, index) => {
              const Icon = channel.icon;
              return (
                <a
                  className="group rounded-lg border bg-white/5 p-6 transition-all hover:bg-white/10"
                  href={channel.link}
                  key={index}
                  rel={channel.external ? "noopener noreferrer" : undefined}
                  target={channel.external ? "_blank" : undefined}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold text-lg">
                    {channel.title}
                  </h3>
                  <p className="mb-4 text-muted-foreground text-sm">
                    {channel.description}
                  </p>
                  <span className="text-primary text-sm group-hover:underline">
                    {channel.linkText} →
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* For Builders */}
        <div className="mb-16">
          <div className="mb-8 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="font-semibold text-2xl">For Builders</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {builderResources.map((resource, index) => (
              <div className="rounded-lg border bg-white/5 p-6" key={index}>
                <h3 className="mb-2 font-semibold text-lg">{resource.title}</h3>
                <p className="mb-4 text-muted-foreground text-sm">
                  {resource.description}
                </p>
                <ul className="space-y-2">
                  {resource.topics.map((topic, topicIndex) => (
                    <li
                      className="flex items-start gap-2 text-sm"
                      key={topicIndex}
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* For Organizations */}
        <div className="mb-16">
          <div className="mb-8 flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h2 className="font-semibold text-2xl">For Organizations</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {organizationResources.map((resource, index) => (
              <div className="rounded-lg border bg-white/5 p-6" key={index}>
                <h3 className="mb-2 font-semibold text-lg">{resource.title}</h3>
                <p className="mb-4 text-muted-foreground text-sm">
                  {resource.description}
                </p>
                <ul className="space-y-2">
                  {resource.topics.map((topic, topicIndex) => (
                    <li
                      className="flex items-start gap-2 text-sm"
                      key={topicIndex}
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Common Questions */}
        <div className="mb-16">
          <div className="mb-8 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            <h2 className="font-semibold text-2xl">Common Questions</h2>
          </div>
          <div className="space-y-4">
            {commonQuestions.map((item, index) => (
              <details
                className="group rounded-lg border bg-white/5 p-4"
                key={index}
              >
                <summary className="cursor-pointer list-none font-medium text-sm">
                  <div className="flex items-center justify-between">
                    <span>{item.question}</span>
                    <span className="ml-4 transition-transform group-open:rotate-180">
                      ↓
                    </span>
                  </div>
                </summary>
                <p className="mt-4 text-muted-foreground text-sm">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
          <div className="mt-6 text-center">
            <a className="text-primary hover:underline" href="/faq">
              View all FAQs →
            </a>
          </div>
        </div>

        {/* About Opentribe */}
        <div className="mt-16 rounded-lg border border-primary/20 bg-primary/5 p-6">
          <h3 className="mb-3 font-semibold text-xl">About Opentribe</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Opentribe is proudly funded by the{" "}
            <a
              className="text-primary hover:underline"
              href="https://github.com/PolkadotOpenSourceGrants/apply"
              rel="noopener noreferrer"
              target="_blank"
            >
              Polkadot Open Source Grants program
            </a>
            . We're a small team building tools to connect builders and
            organizations across the Polkadot ecosystem.
          </p>
          <p className="mt-4 text-base font-medium text-foreground leading-relaxed">
            Our mission is to serve as the "Talent Layer" for Polkadot—a
            centralized marketplace that consolidates official grant
            opportunities and enables ecosystem projects to discover and engage
            skilled contributors for bounties, grants, and RFPs.
          </p>
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
            Built with ❤️ for the Polkadot ecosystem, we're committed to making
            it easier for builders to find opportunities and for organizations
            to connect with talent.
          </p>
          <p className="mt-6 rounded-md border-l-2 border-primary/40 bg-white/5 py-2 pl-4 pr-3 text-muted-foreground text-sm italic leading-relaxed">
            <strong className="not-italic font-semibold text-foreground">Note:</strong> "Polkadot Bounty" in the governance context
            refers to treasury grants (like what funds Opentribe), which is
            different from "bounties" listed on our platform. We're working to
            make this naming clearer!
          </p>
        </div>

        {/* Contact CTA */}
        <div className="mt-16 rounded-lg border bg-white/5 p-8 text-center">
          <h2 className="mb-2 font-semibold text-2xl">Still Need Help?</h2>
          <p className="mb-6 text-muted-foreground">
            Can't find what you're looking for? Our team is here to help.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 py-2 font-medium text-primary-foreground text-sm ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href="/contact"
            >
              Contact Us
            </a>
            <a
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 py-2 font-medium text-sm ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href="mailto:support@opentribe.io"
            >
              Email Support
            </a>
          </div>
          <p className="mt-6 text-muted-foreground text-sm">
            Response Time: 24-72 hours | Office Hours: Mon-Fri, 10 AM - 6 PM IST
          </p>
        </div>
      </div>
    </div>
  );
};

export default Support;
