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

// Proxy API requests through Next.js to share auth cookies (same-origin)
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
nextConfig.rewrites = async () => [
  {
    source: "/api/v1/:path*",
    destination: `${apiUrl}/api/v1/:path*`,
  },
  {
    source: "/api/auth/:path*",
    destination: `${apiUrl}/api/auth/:path*`,
  },
];

// Enable standalone mode for Docker deployments
if (process.env.OUTPUT_STANDALONE === "true") {
  nextConfig.output = "standalone";
}

export default nextConfig;
