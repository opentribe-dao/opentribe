import { keys as auth } from "@packages/auth/keys";
import { keys as db } from "@packages/db/keys";
import { keys as email } from "@packages/email/keys";
import { keys as security } from "@packages/security/keys";
import { createEnv } from "@t3-oss/env-nextjs";
import { keys as core } from "@tooling/next-config/keys";
import { z } from "zod";

export const env = createEnv({
  extends: [auth(), core(), db(), email(), security()],
  server: {},
  client: {
    NEXT_PUBLIC_API_URL: z.url(),
    NEXT_PUBLIC_WEB_URL: z.url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  },
});
