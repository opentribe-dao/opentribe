import path from "node:path";
import { defineConfig, env } from "prisma/config";
import { config } from "dotenv";

// Load .env.local first (overrides), then .env as fallback
config({ path: path.join(__dirname, ".env.local"), override: true });
config({ path: path.join(__dirname, ".env") });

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
  },
});
