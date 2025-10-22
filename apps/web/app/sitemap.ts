import { env } from "@/env";
import type { MetadataRoute } from "next";
import { blog, legal } from "@packages/cms";

// Only include indexable, public routes
const staticRoutes: string[] = [
  "/",
  "/blog",
  "/bounties",
  "/grants",
  "/rfps",
  "/changelog",
  "/contact",
  "/faq",
];

function getBaseUrl(): URL {
  const fromPublic = env.NEXT_PUBLIC_WEB_URL;
  if (fromPublic) {
    return new URL(fromPublic);
  }
  const project = env.VERCEL_PROJECT_PRODUCTION_URL;
  if (project) {
    return new URL(`https://${project}`);
  }
  return new URL("http://localhost:3000");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getBaseUrl();

  const entries: MetadataRoute.Sitemap = [];

  for (const path of staticRoutes) {
    entries.push({ url: new URL(path, base).href, lastModified: new Date() });
  }

  for (const post of blog.getPosts()) {
    entries.push({
      url: new URL(`/blog/${post._slug}`, base).href,
      lastModified: new Date(post.date || Date.now()),
    });
  }

  for (const page of legal.getPosts()) {
    entries.push({
      url: new URL(`/legal/${page._slug}`, base).href,
      lastModified: new Date(page.date || Date.now()),
    });
  }

  return entries;
}
