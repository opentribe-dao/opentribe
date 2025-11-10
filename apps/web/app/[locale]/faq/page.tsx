import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@packages/base/components/ui/accordion";
import { getDictionary } from "@packages/i18n";
import { getSiteUrl } from "@packages/seo/config";
import type { FAQPage, WithContext } from "@packages/seo/json-ld";
import { JsonLd } from "@packages/seo/json-ld";
import { createSiteMetadata } from "@packages/seo/meta";
import type { Metadata } from "next";

// Builder-specific FAQs
const BuilderFaqs = () => {
  const builderItems = [
    {
      id: "builder-1",
      question: "How do I get started as a Builder?",
      answer:
        "As a Builder, you can browse opportunities (grants, bounties, RFPs), build your profile to showcase skills and experience, apply for grants and submit work to bounties, and earn recognition through quality contributions.",
    },
    {
      id: "builder-2",
      question: "How do I apply for grants?",
      answer:
        "You can browse available grants on the platform, review the requirements and RFPs (Request for Proposals), submit your application with your proposal, and track the status of your application through the dashboard.",
    },
    {
      id: "builder-3",
      question: "What is the difference between grants and bounties?",
      answer:
        "Grants are official funding programs with structured RFPs and application processes, while bounties are specific tasks with defined deliverables and multi-winner reward structures. Grants typically have longer timelines and larger funding amounts.",
    },
    {
      id: "builder-4",
      question: "How do I track my submissions and applications?",
      answer:
        "All your submissions and applications are tracked transparently through your dashboard. You can see the status of each submission, track payments, and monitor your reputation and likes earned from quality contributions.",
    },
    {
      id: "builder-5",
      question: "Can I contribute to multiple bounties simultaneously?",
      answer:
        "Yes, you can work on multiple bounties at the same time. The platform allows you to manage multiple submissions and track progress across different opportunities simultaneously.",
    },
    {
      id: "builder-6",
      question: "How do I build my reputation on the platform?",
      answer:
        "You can build your reputation by submitting high-quality work to bounties, receiving likes and recognition from the community, maintaining a complete and professional profile, and consistently delivering excellent contributions that get selected as winners.",
    },
  ];

  return (
    <div className="mb-16">
      <h2 className="mb-8 font-bold text-2xl text-foreground">For Builders</h2>
      <Accordion collapsible type="single">
        {builderItems.map((item, index) => (
          <AccordionItem key={index} value={`builder-item-${index}`}>
            <AccordionTrigger className="font-semibold hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

// Organization-specific FAQs
const OrganizationFaqs = () => {
  const organizationItems = [
    {
      id: "org-1",
      question: "How do I create an organization account?",
      answer:
        "Organizations can post bounties, manage submissions, review and select winners, track payments, build teams by finding talented contributors, and manage organization roles by inviting team members.",
    },
    {
      id: "org-2",
      question: "What are multi-winner bounties?",
      answer:
        "Multi-winner bounties are tasks posted by organizations that allow multiple contributors to win rewards. They feature tiered reward structures, enabling organizations to recognize different levels of contribution quality and effort.",
    },
    {
      id: "org-3",
      question: "How do organizations select winners for bounties?",
      answer:
        "Organizations can review all submissions, evaluate them based on quality and completeness, select multiple winners according to the bounty's tiered reward structure, and track payments to winners through the platform's management tools.",
    },
    {
      id: "org-4",
      question: "How do I manage my team and organization roles?",
      answer:
        "You can invite team members to your organization, assign different roles and permissions, manage access levels, and coordinate team activities through the organization dashboard.",
    },
    {
      id: "org-5",
      question: "What features are available for Grant Curators?",
      answer:
        "Grant Curators can publish RFPs (Request for Proposals), manage applications, review and process grant applications efficiently, and track community engagement through votes and comments.",
    },
    {
      id: "org-6",
      question: "How do I find talented contributors for my projects?",
      answer:
        "You can browse builder profiles, review their skills and past contributions, post bounties to attract specific talent, and use the platform's matching features to connect with qualified contributors.",
    },
  ];

  return (
    <div className="mb-16">
      <h2 className="mb-8 font-bold text-2xl text-foreground">
        For Organizations
      </h2>
      <Accordion collapsible type="single">
        {organizationItems.map((item, index) => (
          <AccordionItem key={index} value={`org-item-${index}`}>
            <AccordionTrigger className="font-semibold hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

type FaqProps = {
  params: Promise<{
    locale: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: FaqProps): Promise<Metadata> => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return createSiteMetadata({
    title: dictionary.seo.faq.title,
    description: dictionary.seo.faq.description,
    keywords: dictionary.seo.faq.keywords,
    image: "/api/og?title=Frequently Asked Questions",
  });
};

const Faq = async ({ params }: FaqProps) => {
  const { locale } = await params;
  await getDictionary(locale);
  const siteUrl = getSiteUrl();

  // All FAQ items for structured data
  const generalFaqs = [
    {
      question: "What is Opentribe?",
      answer:
        "Opentribe is a centralized talent marketplace for the Polkadot ecosystem, serving as the 'Talent Layer' that connects organizations with skilled contributors. It consolidates official Polkadot Grant opportunities and enables ecosystem projects to post and manage multi-winner bounties.",
    },
    {
      question: "What authentication methods are supported?",
      answer:
        "Opentribe supports multiple authentication methods including wallet connections, Google OAuth, and GitHub OAuth through Better Auth integration, providing flexibility for different user preferences.",
    },
    {
      question: "Is Opentribe only for Polkadot ecosystem projects?",
      answer:
        "Yes, Opentribe is specifically designed as the 'Talent Layer' for the Polkadot ecosystem. It consolidates official Polkadot Grant opportunities and serves projects within the Polkadot ecosystem, connecting them with skilled contributors.",
    },
    {
      question: "How do I get help or support?",
      answer:
        "You can access the documentation at docs.opentribe.io, check the platform's help resources, or contact support through the platform. The project also has comprehensive testing and development resources for contributors.",
    },
  ];

  const builderFaqs = [
    {
      question: "How do I get started as a Builder?",
      answer:
        "As a Builder, you can browse opportunities (grants, bounties, RFPs), build your profile to showcase skills and experience, apply for grants and submit work to bounties, and earn recognition through quality contributions.",
    },
    {
      question: "How do I apply for grants?",
      answer:
        "You can browse available grants on the platform, review the requirements and RFPs (Request for Proposals), submit your application with your proposal, and track the status of your application through the dashboard.",
    },
    {
      question: "What is the difference between grants and bounties?",
      answer:
        "Grants are official funding programs with structured RFPs and application processes, while bounties are specific tasks with defined deliverables and multi-winner reward structures. Grants typically have longer timelines and larger funding amounts.",
    },
    {
      question: "How do I track my submissions and applications?",
      answer:
        "All your submissions and applications are tracked transparently through your dashboard. You can see the status of each submission, track payments, and monitor your reputation and likes earned from quality contributions.",
    },
    {
      question: "Can I contribute to multiple bounties simultaneously?",
      answer:
        "Yes, you can work on multiple bounties at the same time. The platform allows you to manage multiple submissions and track progress across different opportunities simultaneously.",
    },
    {
      question: "How do I build my reputation on the platform?",
      answer:
        "You can build your reputation by submitting high-quality work to bounties, receiving likes and recognition from the community, maintaining a complete and professional profile, and consistently delivering excellent contributions that get selected as winners.",
    },
  ];

  const organizationFaqs = [
    {
      question: "How do I create an organization account?",
      answer:
        "Organizations can post bounties, manage submissions, review and select winners, track payments, build teams by finding talented contributors, and manage organization roles by inviting team members.",
    },
    {
      question: "What are multi-winner bounties?",
      answer:
        "Multi-winner bounties are tasks posted by organizations that allow multiple contributors to win rewards. They feature tiered reward structures, enabling organizations to recognize different levels of contribution quality and effort.",
    },
    {
      question: "How do organizations select winners for bounties?",
      answer:
        "Organizations can review all submissions, evaluate them based on quality and completeness, select multiple winners according to the bounty's tiered reward structure, and track payments to winners through the platform's management tools.",
    },
    {
      question: "How do I manage my team and organization roles?",
      answer:
        "You can invite team members to your organization, assign different roles and permissions, manage access levels, and coordinate team activities through the organization dashboard.",
    },
    {
      question: "What features are available for Grant Curators?",
      answer:
        "Grant Curators can publish RFPs (Request for Proposals), manage applications, review and process grant applications efficiently, and track community engagement through votes and comments.",
    },
    {
      question: "How do I find talented contributors for my projects?",
      answer:
        "You can browse builder profiles, review their skills and past contributions, post bounties to attract specific talent, and use the platform's matching features to connect with qualified contributors.",
    },
  ];

  const allFaqs = [...generalFaqs, ...builderFaqs, ...organizationFaqs];

  const faqSchema: WithContext<FAQPage> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <JsonLd code={faqSchema} />
      <section className="px-8 py-16">
        <div className="container mx-auto max-w-3xl">
          <h1 className="mb-4 font-semibold text-3xl md:mb-11 md:text-4xl">
            Frequently asked questions
          </h1>

          {/* General FAQs */}
          <div className="mb-16">
            <h2 className="mb-8 font-bold text-2xl text-foreground">General</h2>
            <Accordion collapsible type="single">
              {generalFaqs.map((faq, index) => (
                <AccordionItem key={index} value={`general-${index}`}>
                  <AccordionTrigger className="font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Builder FAQs */}
          <BuilderFaqs />

          {/* Organization FAQs */}
          <OrganizationFaqs />
        </div>
      </section>
    </>
  );
};

export default Faq;
