import fs from "node:fs";
import { env } from "@/env";
import type { MetadataRoute } from "next";

const appFolders = fs.readdirSync("app/[locale]", { withFileTypes: true });
const pages = appFolders
  .filter((file) => file.isDirectory())
  .filter((folder) => !folder.name.startsWith("_"))
  .filter((folder) => !folder.name.startsWith("("))
  .map((folder) => folder.name);

const blogs = fs
  .readdirSync("content/blog", { withFileTypes: true })
  .filter((file) => !file.isDirectory())
  .filter((file) => !file.name.startsWith("_"))
  .filter((file) => !file.name.startsWith("("))
  .map((file) => file.name.replace(".mdx", ""));

const legals = fs
  .readdirSync("content/legal", { withFileTypes: true })
  .filter((file) => !file.isDirectory())
  .filter((file) => !file.name.startsWith("_"))
  .filter((file) => !file.name.startsWith("("))
  .map((file) => file.name.replace(".mdx", ""));

const url = new URL(
  env.VERCEL_PROJECT_PRODUCTION_URL || "https://opentribe.io"
);

const sitemap = async (): Promise<MetadataRoute.Sitemap> => [
  {
    url: new URL("/", url).href,
    lastModified: new Date(),
  },
  ...pages.map((page) => ({
    url: new URL(page, url).href,
    lastModified: new Date(),
  })),
  ...blogs.map((blog) => ({
    url: new URL(`blog/${blog}`, url).href,
    lastModified: new Date(),
  })),
  ...legals.map((legal) => ({
    url: new URL(`legal/${legal}`, url).href,
    lastModified: new Date(),
  })),
];

export default sitemap;
