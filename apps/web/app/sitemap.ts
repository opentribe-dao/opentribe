import { blog, legal } from "@packages/cms";
import type { MetadataRoute } from "next";
import { env } from "@/env";

type RouteConfig = {
  path: string;
  priority: number;
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
};

// Only include indexable, public routes with SEO priorities
const staticRoutes: RouteConfig[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/bounties", priority: 0.8, changeFrequency: "weekly" },
  { path: "/grants", priority: 0.8, changeFrequency: "weekly" },
  { path: "/rfps", priority: 0.8, changeFrequency: "weekly" },
  { path: "/organizations", priority: 0.8, changeFrequency: "weekly" },
  { path: "/changelog", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
];

interface SitemapSlug {
  slug: string;
}

async function fetchSlugs(endpoint: string): Promise<SitemapSlug[]> {
  try {
    const apiUrl = env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return [];
    const res = await fetch(`${apiUrl}${endpoint}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.slugs || data || [];
  } catch {
    return [];
  }
}

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

  // Add static routes with priority and changeFrequency
  for (const route of staticRoutes) {
    entries.push({
      url: new URL(route.path, base).href,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    });
  }

  // Add blog posts
  for (const post of blog.getPosts()) {
    entries.push({
      url: new URL(`/blog/${post._slug}`, base).href,
      lastModified: new Date(post.date || Date.now()),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  // Add legal pages
  for (const page of legal.getPosts()) {
    entries.push({
      url: new URL(`/legal/${page._slug}`, base).href,
      lastModified: new Date(page.date || Date.now()),
      changeFrequency: "yearly",
      priority: 0.3,
    });
  }

  // Add ecosystem profile pages
  const profileSlugs = await fetchSlugs(
    "/api/v1/profiles/sitemap-slugs"
  );
  for (const { slug } of profileSlugs) {
    entries.push({
      url: new URL(`/profile/${slug}`, base).href,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // Add organization pages
  const orgSlugs = await fetchSlugs(
    "/api/v1/organizations/sitemap-slugs"
  );
  for (const { slug } of orgSlugs) {
    entries.push({
      url: new URL(`/organizations/${slug}`, base).href,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return entries;
}
