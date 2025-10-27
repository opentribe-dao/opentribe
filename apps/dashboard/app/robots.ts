import type { MetadataRoute } from "next";

// Disallow indexing entirely for the dashboard subdomain
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/"],
    },
  };
}
