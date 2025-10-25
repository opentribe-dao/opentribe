import "./styles.css";
import { BaseProvider, Background } from "@packages/base";
import { fonts } from "@packages/base/lib/fonts";
import { cn } from "@packages/base/lib/utils";
import { Toolbar } from "@packages/feature-flags/components/toolbar";
import { AnalyticsProvider } from "@packages/analytics";
import type { ReactNode } from "react";
import ReactQueryProvider from "../components/react-query-provider";

type RootLayoutProperties = {
  readonly children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html
    lang="en"
    className={cn(fonts, "dark scroll-smooth")}
    suppressHydrationWarning
  >
    <body className="min-h-screen">
      <AnalyticsProvider>
        <Background />
        <BaseProvider>
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </BaseProvider>
        <Toolbar />
      </AnalyticsProvider>
    </body>
  </html>
);

export default RootLayout;
