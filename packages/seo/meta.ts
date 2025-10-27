import merge from "lodash.merge";
import type { Metadata } from "next";
import {
  author,
  defaultDescription,
  defaultKeywords,
  getSiteUrl,
  locales,
  publisher,
  siteName,
  twitterHandle,
} from "./config";

export function clamp(input: string, max: number): string {
  if (!input) return "";
  const trimmed = input.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function clampTitle(input: string, max = 60): string {
  return clamp(input, max);
}

export function clampDescription(input: string, max = 155): string {
  return clamp(input, max);
}

export function createSiteMetadata(
  partial: Omit<Metadata, "title" | "description"> & {
    title: string;
    description: string;
    keywords?: string[];
  }
): Metadata {
  const baseUrl = getSiteUrl();
  const parsedTitle = `${clampTitle(partial.title)} | ${siteName}`;

  const defaults: Metadata = {
    title: parsedTitle,
    description: clampDescription(partial.description || defaultDescription),
    metadataBase: baseUrl,
    applicationName: siteName,
    authors: [author],
    creator: author.name,
    publisher,
    keywords: partial.keywords ?? defaultKeywords,
    openGraph: {
      title: parsedTitle,
      description: clampDescription(partial.description || defaultDescription),
      type: "website",
      siteName,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      creator: twitterHandle,
    },
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, new URL(`/${l}`, baseUrl).href])
      ),
    },
  };

  return merge(defaults, partial);
}

export function createDetailMetadata({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const baseUrl = getSiteUrl();
  const pageUrl = new URL(path, baseUrl).href;
  const parsedTitle = `${clampTitle(title)} | ${siteName}`;

  const meta: Metadata = {
    title: parsedTitle,
    description: clampDescription(description || defaultDescription),
    metadataBase: baseUrl,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: parsedTitle,
      description: clampDescription(description || defaultDescription),
      url: pageUrl,
      type: "article",
      siteName,
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      creator: twitterHandle,
      title: parsedTitle,
      description: clampDescription(description || defaultDescription),
      images: image ? [image] : undefined,
    },
  };

  return meta;
}
