import { blog, type Post } from "@packages/cms";
import { Body } from "@packages/cms/components/body";
import { CodeBlock } from "@packages/cms/components/code-block";
import { TableOfContents } from "@packages/cms/components/toc";
import { createBreadcrumbSchema } from "@packages/seo/breadcrumbs";
import { JsonLd } from "@packages/seo/json-ld";
import { createDetailMetadata } from "@packages/seo/meta";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type React from "react";
import { Sidebar } from "@/app/[locale]/components/sidebar";
import { env } from "@/env";

const getBaseUrl = () => {
  if (env.VERCEL_PROJECT_PRODUCTION_URL) {
    const protocol = env.VERCEL_PROJECT_PRODUCTION_URL.startsWith("https")
      ? "https"
      : "http";
    return `${protocol}://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "https://opentribe.io";
};

type BlogPostProperties = {
  readonly params: Promise<{
    slug: string;
  }>;
};

export const generateMetadata = async ({
  params,
}: BlogPostProperties): Promise<Metadata> => {
  const { slug } = await params;
  const post = blog.getPost(slug);

  if (!post) {
    return {};
  }

  return createDetailMetadata({
    title: post._title,
    description: post.description,
    path: `/blog/${slug}`,
    image: `/api/og/blog/${slug}`,
  });
};

export const generateStaticParams = () => {
  const posts = blog.getPosts();
  return posts.map(({ _slug }: Post) => ({
    locale: "en",
    slug: _slug,
  }));
};

const BlogPost = async ({ params }: BlogPostProperties) => {
  const { slug } = await params;
  const page = blog.getPost(slug);

  if (!page) {
    notFound();
  }

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: page._title, path: `/blog/${page._slug}` },
  ]);

  // Calculate word count from body content
  const wordCount = page.body
    ? page.body.split(/\s+/).filter((word: string) => word.length > 0).length
    : 0;

  return (
    <>
      <JsonLd
        code={{
          "@type": "BlogPosting",
          "@context": "https://schema.org",
          datePublished: page.date,
          description: page.description,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${getBaseUrl()}/blog/${page._slug}`,
          },
          headline: page._title,
          image: page.image,
          dateModified: page.date,
          author: page.authors?.at(0),
          isAccessibleForFree: true,
          wordCount,
          publisher: {
            "@type": "Organization",
            name: "Opentribe",
            logo: {
              "@type": "ImageObject",
              url: `${getBaseUrl()}/images/opentribe-logo.png`,
            },
          },
        }}
      />
      <JsonLd code={breadcrumbSchema} />
      <div className="container mx-auto py-16">
        <Link
          className="mb-4 inline-flex items-center gap-1 text-muted-foreground text-sm focus:underline focus:outline-none"
          href="/blog"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Blog
        </Link>
        <div className="mt-16 flex flex-col items-start gap-8 sm:flex-row">
          <div className="sm:flex-1">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              {/* <h1 className="scroll-m-20 text-balance font-extrabold text-4xl tracking-tight lg:text-5xl">
                {page._title}
              </h1>
              <p className="text-balance leading-7 [&:not(:first-child)]:mt-6">
                {page.description}
              </p> */}
              {/* {page.image ? (
                <Image
                  src={page.image}
                  width={600}
                  height={300}
                  alt=""
                  className="my-16 h-full w-full rounded-xl"
                />
              ) : undefined} */}
              <div className="mx-auto max-w-prose">
                <Body
                  components={{
                    pre: ({
                      children,
                      ...props
                    }: {
                      children: React.ReactNode;
                    } & React.ComponentProps<"pre">) => (
                      <CodeBlock {...props}>{children}</CodeBlock>
                    ),
                  }}
                  content={page.body}
                />
              </div>
            </div>
          </div>
          <div className="sticky top-24 hidden shrink-0 md:block">
            <Sidebar
              date={new Date(page.date)}
              readingTime={`${page.readingTime} min read`}
              toc={<TableOfContents data={page.content} />}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogPost;
