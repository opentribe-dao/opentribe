import { type Legal, legal } from '@packages/cms';
import { Body } from '@packages/cms/components/body';
import { getDictionary } from '@packages/i18n';
import { createSiteMetadata } from '@packages/seo/meta';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type LegalPageProperties = {
  readonly params: Promise<{
    locale: string;
    slug: string;
  }>;
};

// Map slug to i18n key
const getLegalSeoKey = (slug: string): 'cookiePolicy' | 'privacyPolicy' | 'termsOfService' | null => {
  const mapping: Record<string, 'cookiePolicy' | 'privacyPolicy' | 'termsOfService'> = {
    'cookie-policy': 'cookiePolicy',
    'privacy-policy': 'privacyPolicy',
    'terms-of-service': 'termsOfService',
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

  return createSiteMetadata({
    title: seoContent?.title || post._title,
    description: seoContent?.description || post.description,
    keywords: seoContent?.keywords,
  });
};

export const generateStaticParams = () => {
  const posts = legal.getPosts();
  return posts.map(({ _slug }: Legal) => ({
    locale: 'en',
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
    <div className="container mx-auto px-4 pt-8 pb-16 sm:px-6 sm:pt-12 md:pt-16 md:pb-20 lg:px-8">
      {/* Page Title - Responsive Text Size */}
      <h1 className="scroll-m-20 text-balance font-extrabold text-3xl tracking-tight sm:text-4xl lg:text-5xl">
        {page._title}
      </h1>

      {/* Description */}
      <p className="text-balance text-sm leading-7 sm:text-base [&:not(:first-child)]:mt-4 sm:[&:not(:first-child)]:mt-6">
        {page.description}
      </p>

      {/* Main Content Area */}
      <div className="mt-4 flex flex-col items-start gap-8 sm:mt-12 md:mt-16 md:flex-row lg:gap-12">
        {/* Article Content - Responsive Width */}
        <div className="w-full md:flex-1">
          <article className="prose prose-neutral prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none">
            <Body content={page.body} />
          </article>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
