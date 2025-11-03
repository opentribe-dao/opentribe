import { getDictionary } from "@packages/i18n";
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
  });
};

const BountiesLayout = ({ children }: BountiesLayoutProps) => <>{children}</>;

export default BountiesLayout;
