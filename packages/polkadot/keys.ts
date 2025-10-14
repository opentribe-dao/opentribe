import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const keys = () =>
  createEnv({
    server: {
      SUBSCAN_API_KEY: z.string(),
    },
    runtimeEnv: {
      SUBSCAN_API_KEY: process.env.SUBSCAN_API_KEY,
    },
  });
