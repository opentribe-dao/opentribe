import { env } from "@/env";
import { withToolbar } from "@packages/feature-flags/lib/toolbar";
import { withLogging, withSentry } from "@packages/logging/next-config";
import { config, withAnalyzer } from "@tooling/next-config";
import type { NextConfig } from "next";

let nextConfig: NextConfig = withToolbar(withLogging(config));

// Ensure images config is properly initialized
if (!nextConfig.images) {
  nextConfig.images = {};
}
if (!nextConfig.images.remotePatterns) {
  nextConfig.images.remotePatterns = [];
}

nextConfig.images.remotePatterns.push({
  protocol: "https",
  hostname: "assets.orama.com",
});

// Add Polkadot ecosystem image domains
nextConfig.images.remotePatterns.push(
  {
    protocol: "https",
    hostname: "futures.web3.foundation",
  },
  {
    protocol: "https",
    hostname: "polkadot.network",
  },
  {
    protocol: "https",
    hostname: "substrate.io",
  },
  {
    protocol: "https",
    hostname: "**.polkadot.network",
  },
  {
    protocol: "https",
    hostname: "**.web3.foundation",
  },
  {
    protocol: "https",
    hostname: "**.kusama.network",
  },
  {
    protocol: "https",
    hostname: "github.com",
  },
  {
    protocol: "https",
    hostname: "avatars.githubusercontent.com",
  },
  {
    protocol: "https",
    hostname: "logosandtypes.com",
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

nextConfig = withSentry(nextConfig);

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

// Enable standalone mode for Docker deployments
if (process.env.OUTPUT_STANDALONE === "true") {
  nextConfig.output = "standalone";
}

export default nextConfig;
