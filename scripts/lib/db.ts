/**
 * Standalone Prisma client for import scripts.
 * Uses PrismaPg adapter for Prisma 7 compatibility.
 */

import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../packages/db/generated/client";

// Load env from packages/db/.env.local first, then .env
config({
  path: resolve(import.meta.dirname, "../../packages/db/.env.local"),
  override: true,
});
config({ path: resolve(import.meta.dirname, "../../packages/db/.env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const database = new PrismaClient({ adapter });
