import type { BreadcrumbList, ListItem, WithContext } from "schema-dts";
import { getSiteUrl } from "./config";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

/**
 * Creates a BreadcrumbList schema for navigation breadcrumbs
 * @param items - Array of breadcrumb items with name and path
 * @returns Schema.org BreadcrumbList structured data
 *
 * @example
 * ```typescript
 * const breadcrumbs = createBreadcrumbSchema([
 *   { name: 'Home', path: '/' },
 *   { name: 'Blog', path: '/blog' },
 *   { name: 'Article Title', path: '/blog/article-slug' }
 * ]);
 * ```
 */
export function createBreadcrumbSchema(
  items: BreadcrumbItem[]
): WithContext<BreadcrumbList> {
  const siteUrl = getSiteUrl();

  const itemListElement: ListItem[] = items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: new URL(item.path, siteUrl).href,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}
