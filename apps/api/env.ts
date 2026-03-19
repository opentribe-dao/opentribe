import { keys as analytics } from "@packages/analytics/keys";
import { keys as auth } from "@packages/auth/keys";
import { keys as db } from "@packages/db/keys";
import { keys as email } from "@packages/email/keys";
import { keys as logging } from "@packages/logging/keys";
import { keys as storage } from "@packages/storage/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { keys as core } from "@tooling/next-config/keys";
import { z } from "zod";

export const env = createEnv({
  extends: [auth(), analytics(), core(), db(), email(), logging(), storage()],
  server: {
    CRON_SECRET: z.string().min(32).optional(),
  },
  client: {},
  runtimeEnv: {
    CRON_SECRET: process.env.CRON_SECRET,
  },
});
