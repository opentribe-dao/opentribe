import { type Legal, legal } from "@packages/cms";
import { Body } from "@packages/cms/components/body";
import { getDictionary } from "@packages/i18n";
import { createSiteMetadata } from "@packages/seo/meta";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type LegalPageProperties = {
  readonly params: Promise<{
    locale: string;
    slug: string;
  }>;
};

// Map slug to i18n key
const getLegalSeoKey = (
  slug: string
): "cookiePolicy" | "privacyPolicy" | "termsOfService" | null => {
  const mapping: Record<
    string,
    "cookiePolicy" | "privacyPolicy" | "termsOfService"
  > = {
    "cookie-policy": "cookiePolicy",
    "privacy-policy": "privacyPolicy",
    "terms-of-service": "termsOfService",
  };
  return mapping[slug] || null;
};

export const generateMetadata = async ({
  params,
}: LegalPageProperties): Promise<Metadata> => {
  const { locale, slug } = await params;
  const dictionary = await getDictionary(locale);
  const post = legal.getPost(slug);

  if (!post) {
    return {};
  }

  // Try to get SEO content from i18n, fall back to CMS content
  const seoKey = getLegalSeoKey(slug);
  const seoContent = seoKey ? dictionary.seo.legal[seoKey] : null;

  // Generate OG image title based on slug
  const ogTitles: Record<string, string> = {
    "cookie-policy": "Cookie Policy",
    "privacy-policy": "Privacy Policy",
    "terms-of-service": "Terms of Service",
  };
  const ogTitle = ogTitles[slug] || "Legal";

  return createSiteMetadata({
    title: seoContent?.title || post._title,
    description: seoContent?.description || post.description,
    keywords: seoContent?.keywords,
    image: `/api/og?title=${encodeURIComponent(ogTitle)}`,
  });
};

export const generateStaticParams = () => {
  const posts = legal.getPosts();
  return posts.map(({ _slug }: Legal) => ({
    locale: "en",
    slug: _slug,
  }));
};

const LegalPage = async ({ params }: LegalPageProperties) => {
  const { slug } = await params;
  const page = legal.getPost(slug);

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Hero Section - matches support page */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 font-bold text-4xl tracking-tight md:text-6xl">
            {page._title}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            {page.description}
          </p>

          {/* Metadata badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-muted-foreground text-sm">
            <span>
              Last Updated:{" "}
              {new Date(page.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Article Content */}
        <article className="prose prose-neutral prose-sm sm:prose-base md:prose-lg dark:prose-invert mx-auto max-w-none lg:max-w-4xl">
          <Body content={page.body} />
        </article>
      </div>
    </div>
  );
};

export default LegalPage;
