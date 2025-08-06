import "./styles.css";
import { BaseProvider, Background } from "@packages/base";
import { fonts } from "@packages/base/lib/fonts";
import { cn } from "@packages/base/lib/utils";
import { Toolbar } from "@packages/feature-flags/components/toolbar";
import type { ReactNode } from "react";

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
      <Background />
      <BaseProvider>{children}</BaseProvider>
      <Toolbar />
    </body>
  </html>
);

export default RootLayout;
