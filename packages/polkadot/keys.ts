import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    server: {
      SUBSCAN_API_KEY: z.string(),
      COINMARKETCAP_API_KEY: z.string(),
      COINMARKETCAP_API_URL: z
        .url()
        .default("https://pro-api.coinmarketcap.com"),
    },
    runtimeEnv: {
      SUBSCAN_API_KEY: process.env.SUBSCAN_API_KEY,
      COINMARKETCAP_API_KEY: process.env.COINMARKETCAP_API_KEY,
      COINMARKETCAP_API_URL: process.env.COINMARKETCAP_API_URL,
    },
  });
