import { getDictionary } from "@packages/i18n";
import { getSiteUrl } from "@packages/seo/config";
import type { Organization, WithContext } from "@packages/seo/json-ld";
import { JsonLd } from "@packages/seo/json-ld";
import { createSiteMetadata } from "@packages/seo/meta";
import type { ReactNode } from "react";

type HomeLayoutProps = {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
};

export const generateMetadata = async ({ params }: HomeLayoutProps) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return createSiteMetadata({
    title: dictionary.seo.homepage.title,
    description: dictionary.seo.homepage.description,
    keywords: dictionary.seo.homepage.keywords,
    image: '/api/og',
    path: '/',
  });
};

const HomeLayout = ({ children }: HomeLayoutProps) => {
  const siteUrl = getSiteUrl();

  const organizationSchema: WithContext<Organization> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Opentribe",
    url: siteUrl.href,
    logo: `${siteUrl.href}/icon.png`,
    description: "The centralized talent marketplace for the Polkadot ecosystem, connecting organizations with skilled contributors through grants, bounties, and RFPs.",
    sameAs: [
      "https://twitter.com/opentribe_io",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      url: `${siteUrl.href}/contact`,
    },
  };

  return (
    <>
      <JsonLd code={organizationSchema} />
      {children}
    </>
  );
};

export default HomeLayout;
