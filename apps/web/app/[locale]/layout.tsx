import "./styles.css";
import { AuthProvider } from "@packages/auth/provider";
import { BaseProvider, Background } from "@packages/base";
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

type RootLayoutProperties = {
  readonly children: ReactNode;
  readonly params: Promise<{
    locale: string;
  }>;
};

const RootLayout = async ({ children, params }: RootLayoutProperties) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);

  const consent = cookies().get("cookie_consent")?.value;
  return (
    <html
      lang="en"
      className={cn(fonts, "scroll-smooth")}
      suppressHydrationWarning
    >
      <body>
        <Background />
        <BaseProvider>
          <AuthProvider>
          <Providers>
            <SiteLayout dictionary={dictionary}>
              {children}
            </SiteLayout>
            <Toaster />
            {!consent && <CookieBanner />}
          </Providers>
          </AuthProvider>
        </BaseProvider>
        <Toolbar />
        {/*<CMSToolbar />*/}
      </body>
    </html>
  );
};

export default RootLayout;
