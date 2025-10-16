import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      RESEND_FROM: z.string().email(),
      RESEND_TOKEN: z.string().startsWith("re_"),
      RESEND_GENERAL_AUDIENCE_ID: z
        .string()
        .default("fca6d77f-e6ed-4d07-88c5-0ea4e774705a"),
    },
    runtimeEnv: {
      RESEND_FROM: process.env.RESEND_FROM,
      RESEND_TOKEN: process.env.RESEND_TOKEN,
      RESEND_GENERAL_AUDIENCE_ID: process.env.RESEND_GENERAL_AUDIENCE_ID,
    },
  });
