import "./styles.css";
import { BaseProvider } from "@packages/base";
import { Background } from "@packages/base/components/background";
import { fonts } from "@packages/base/lib/fonts";
import { cn } from "@packages/base/lib/utils";
import { Toolbar } from "@packages/feature-flags/components/toolbar";
import { getDictionary } from "@packages/i18n";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import CookieBanner from "./legal/components/cookie-banner";
import { SiteLayout } from "./components/site-layout";
import Providers from "./components/providers";
import { AnalyticsProvider } from "@packages/analytics";
import { createSiteMetadata } from "@packages/seo/meta";
import { defaultDescription, defaultKeywords } from "@packages/seo/config";

type RootLayoutProperties = {
  readonly children: ReactNode;
  readonly params: Promise<{
    locale: string;
  }>;
};

const RootLayout = async ({ children, params }: RootLayoutProperties) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  const consent = (await cookies()).get("cookie_consent")?.value;
  return (
    <html
      lang="en"
      className={cn(fonts, "scroll-smooth")}
      suppressHydrationWarning
    >
      <body>
        <AnalyticsProvider>
          <Background />
          <BaseProvider>
            <Providers>
              <SiteLayout dictionary={dictionary}>{children}</SiteLayout>
              <Toaster />
              {!consent && <CookieBanner />}
            </Providers>
          </BaseProvider>
          <Toolbar />
          {/*<CMSToolbar />*/}
        </AnalyticsProvider>
      </body>
    </html>
  );
};

export default RootLayout;

export const metadata = createSiteMetadata({
  title: "Opentribe",
  description: defaultDescription,
  keywords: defaultKeywords,
});
