import { getDictionary } from "@packages/i18n";
import { getSiteUrl } from "@packages/seo/config";
import type { ItemList, WithContext } from "@packages/seo/json-ld";
import { JsonLd } from "@packages/seo/json-ld";
import { createSiteMetadata } from "@packages/seo/meta";
import type { ReactNode } from "react";

type GrantsLayoutProps = {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
};

export const generateMetadata = async ({ params }: GrantsLayoutProps) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return createSiteMetadata({
    title: dictionary.seo.grants.title,
    description: dictionary.seo.grants.description,
    keywords: dictionary.seo.grants.keywords,
    image: '/api/og/grants',
    path: '/grants',
  });
};

const GrantsLayout = ({ children }: GrantsLayoutProps) => {
  const siteUrl = getSiteUrl();

  const itemListSchema: WithContext<ItemList> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Polkadot Grants",
    description: "Official Polkadot grants and funding programs",
    url: new URL('/grants', siteUrl).href,
  };

  return (
    <>
      <JsonLd code={itemListSchema} />
      {children}
    </>
  );
};

export default GrantsLayout;
