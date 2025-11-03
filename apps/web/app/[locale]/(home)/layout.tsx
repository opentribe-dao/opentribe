import { getDictionary } from "@packages/i18n";
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
  });
};

const HomeLayout = ({ children }: HomeLayoutProps) => <>{children}</>;

export default HomeLayout;
