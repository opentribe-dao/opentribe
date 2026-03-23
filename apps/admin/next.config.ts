import { config } from "@tooling/next-config";
import type { NextConfig } from "next";

let nextConfig: NextConfig = { ...config };

// Ensure images config is properly initialized
if (!nextConfig.images) {
  nextConfig.images = {};
}
if (!nextConfig.images.remotePatterns) {
  nextConfig.images.remotePatterns = [];
}

nextConfig.images.remotePatterns.push(
  {
    protocol: "https",
    hostname: "avatars.githubusercontent.com",
  },
  {
    protocol: "https",
    hostname: "**.blob.vercel-storage.com",
  },
  {
    protocol: "https",
    hostname: "**.googleusercontent.com",
  }
);

// Enable standalone mode for Docker deployments
if (process.env.OUTPUT_STANDALONE === "true") {
  nextConfig.output = "standalone";
}

export default nextConfig;
