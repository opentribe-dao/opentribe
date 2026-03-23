/**
 * Standalone Prisma client for import scripts.
 * Avoids the Neon adapter and @t3-oss/env-nextjs dependencies
 * used in the main packages/db export.
 */

import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaClient } from "../../packages/db/generated/client";

// Load env from packages/db/.env
config({ path: resolve(import.meta.dirname, "../../packages/db/.env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const database = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});
