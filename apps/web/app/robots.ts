import { env } from "@/env";
import type { MetadataRoute } from "next";

const url = new URL(
  env.VERCEL_PROJECT_PRODUCTION_URL || "https://opentribe.io"
);

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: new URL("/sitemap.xml", url.href).href,
  };
}
