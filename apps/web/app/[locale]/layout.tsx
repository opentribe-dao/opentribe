import "./styles.css";
import { AnalyticsProvider } from "@packages/analytics";
import { BaseProvider } from "@packages/base";
import { Background } from "@packages/base/components/background";
import { fonts } from "@packages/base/lib/fonts";
import { cn } from "@packages/base/lib/utils";
import { Toolbar } from "@packages/feature-flags/components/toolbar";
import { getDictionary } from "@packages/i18n";
import { defaultDescription, defaultKeywords } from "@packages/seo/config";
import { createSiteMetadata } from "@packages/seo/meta";
import type { Viewport } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import Providers from "./components/providers";
import { SiteLayout } from "./components/site-layout";
import CookieBanner from "./legal/components/cookie-banner";

type RootLayoutProperties = {
  readonly children: ReactNode;
  readonly params: Promise<{
    locale: string;
  }>;
};

const RootLayout = async ({ children, params }: RootLayoutProperties) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  return (
    <html
      className={cn(fonts, "scroll-smooth")}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <AnalyticsProvider>
          <Background />
          <BaseProvider>
            <Providers>
              <SiteLayout dictionary={dictionary}>{children}</SiteLayout>
              <Toaster />
              <CookieBanner />
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E6007A",
};
