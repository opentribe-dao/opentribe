import { getDictionary } from "@packages/i18n";
import { getSiteUrl } from "@packages/seo/config";
import type { ItemList, WithContext } from "@packages/seo/json-ld";
import { JsonLd } from "@packages/seo/json-ld";
import { createSiteMetadata } from "@packages/seo/meta";
import type { ReactNode } from "react";

type RfpsLayoutProps = {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
};

export const generateMetadata = async ({ params }: RfpsLayoutProps) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return createSiteMetadata({
    title: dictionary.seo.rfps.title,
    description: dictionary.seo.rfps.description,
    keywords: dictionary.seo.rfps.keywords,
    image: '/api/og/rfps',
    path: '/rfps',
  });
};

const RfpsLayout = ({ children }: RfpsLayoutProps) => {
  const siteUrl = getSiteUrl();

  const itemListSchema: WithContext<ItemList> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Polkadot RFPs",
    description: "Open RFPs and project proposals in the Polkadot ecosystem",
    url: new URL('/rfps', siteUrl).href,
  };

  return (
    <>
      <JsonLd code={itemListSchema} />
      {children}
    </>
  );
};

export default RfpsLayout;
