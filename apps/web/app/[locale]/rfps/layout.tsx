import { getDictionary } from "@packages/i18n";
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
  });
};

const RfpsLayout = ({ children }: RfpsLayoutProps) => <>{children}</>;

export default RfpsLayout;
