import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      BETTER_AUTH_SECRET: z.string().min(32),
      BETTER_AUTH_URL: z.url().optional(),
      // Additional trusted origins for flexibility (comma-separated)
      ADDITIONAL_TRUSTED_ORIGINS: z.string().optional(),
      // OAuth providers
      GOOGLE_CLIENT_ID: z.string().optional(),
      GOOGLE_CLIENT_SECRET: z.string().optional(),
      GITHUB_CLIENT_ID: z.string().optional(),
      GITHUB_CLIENT_SECRET: z.string().optional(),
    },
    client: {
      NEXT_PUBLIC_BETTER_AUTH_URL: z.url().optional(),
    },
    runtimeEnv: {
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
      NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
      ADDITIONAL_TRUSTED_ORIGINS: process.env.ADDITIONAL_TRUSTED_ORIGINS,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    },
  });
