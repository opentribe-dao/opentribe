import { createMDX } from "fumadocs-mdx/next";
import { withLogging, withSentry } from "@packages/logging/next-config";
import type { NextConfig } from "next";

const withMDX = createMDX();

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@packages/analytics",
    "@packages/base",
    "@packages/logging",
    "@sentry/nextjs",
  ],
};

export default withSentry(withLogging(withMDX(config)));
