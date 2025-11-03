import { getDictionary } from "@packages/i18n";
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
  });
};

const GrantsLayout = ({ children }: GrantsLayoutProps) => <>{children}</>;

export default GrantsLayout;
