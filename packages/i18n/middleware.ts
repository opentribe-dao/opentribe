import { match as matchLocale } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import type { NextRequest } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";
import languine from "./languine.json";

const locales = [languine.locale.source, ...languine.locale.targets];

const I18nMiddleware = createI18nMiddleware({
  locales,
  defaultLocale: "en",
  urlMappingStrategy: "rewriteDefault",
  resolveLocaleFromRequest: (request: NextRequest) => {
    try {
      const headers = Object.fromEntries(request.headers.entries());
      const negotiator = new Negotiator({ headers });
      const acceptedLanguages = negotiator.languages();

      // If no languages provided or empty, return default
      if (!acceptedLanguages || acceptedLanguages.length === 0) {
        return "en";
      }

      const matchedLocale = matchLocale(acceptedLanguages, locales, "en");

      return matchedLocale;
    } catch (error) {
      // Handle RangeError from invalid locale information (e.g., from bots/crawlers)
      console.warn("Failed to resolve locale, defaulting to 'en':", error);
      return "en";
    }
  },
});

export function internationalizationMiddleware(request: NextRequest) {
  return I18nMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|opengraph-image.png|robots.txt|sitemap.xml|manifest.json|.*\\..*).*)",
  ],
};

//https://nextjs.org/docs/app/building-your-application/routing/internationalization
//https://github.com/vercel/next.js/tree/canary/examples/i18n-routing
//https://github.com/QuiiBz/next-international
//https://next-international.vercel.app/docs/app-middleware-configuration
