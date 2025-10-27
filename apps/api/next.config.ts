import { env } from "@/env";
import { withLogging, withSentry } from "@packages/logging/next-config";
import { config, withAnalyzer } from "@tooling/next-config";
import type { NextConfig } from "next";

let nextConfig: NextConfig = withLogging(config);

nextConfig = withSentry(nextConfig);

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

// Enable standalone mode for Docker deployments
if (process.env.OUTPUT_STANDALONE === "true") {
  nextConfig.output = "standalone";
}

export default nextConfig;
