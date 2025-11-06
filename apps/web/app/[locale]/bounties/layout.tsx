import { getDictionary } from "@packages/i18n";
import { getSiteUrl } from "@packages/seo/config";
import type { ItemList, WithContext } from "@packages/seo/json-ld";
import { JsonLd } from "@packages/seo/json-ld";
import { createSiteMetadata } from "@packages/seo/meta";
import type { ReactNode } from "react";

type BountiesLayoutProps = {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
};

export const generateMetadata = async ({ params }: BountiesLayoutProps) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return createSiteMetadata({
    title: dictionary.seo.bounties.title,
    description: dictionary.seo.bounties.description,
    keywords: dictionary.seo.bounties.keywords,
    image: '/api/og/bounties',
    path: '/bounties',
  });
};

const BountiesLayout = ({ children }: BountiesLayoutProps) => {
  const siteUrl = getSiteUrl();

  const itemListSchema: WithContext<ItemList> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Polkadot Bounties",
    description: "Open bounties from top Polkadot projects",
    url: new URL('/bounties', siteUrl).href,
  };

  return (
    <>
      <JsonLd code={itemListSchema} />
      {children}
    </>
  );
};

export default BountiesLayout;
