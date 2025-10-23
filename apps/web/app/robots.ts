import { env } from "@/env";
import type { MetadataRoute } from "next";
import languine from "@packages/i18n/languine.json";

const url = new URL(env.NEXT_PUBLIC_WEB_URL);

const baseDisallow = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
  "/onboarding",
  "/settings",
];

const locales: string[] = [languine.locale.source, ...languine.locale.targets];
const disallowWithLocales = [
  ...baseDisallow,
  ...locales.flatMap((locale) => baseDisallow.map((p) => `/${locale}${p}`)),
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/"],
      disallow: disallowWithLocales,
    },
    sitemap: new URL("/sitemap.xml", url.href).href,
  };
}
