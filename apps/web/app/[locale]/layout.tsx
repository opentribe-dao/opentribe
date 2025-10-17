import "./styles.css";
import { BaseProvider } from "@packages/base";
import { Background } from "@packages/base/components/background";
import { fonts } from "@packages/base/lib/fonts";
import { cn } from "@packages/base/lib/utils";
import { Toolbar } from "@packages/feature-flags/components/toolbar";
import { getDictionary } from "@packages/i18n";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { SiteLayout } from "./components/site-layout";
import Providers from "./components/providers";
import { AnalyticsProvider } from "@packages/analytics";

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
