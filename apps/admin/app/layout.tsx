import "./styles.css";
import { Background, BaseProvider } from "@packages/base";
import { fonts } from "@packages/base/lib/fonts";
import { cn } from "@packages/base/lib/utils";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import ReactQueryProvider from "@/components/react-query-provider";

type RootLayoutProperties = {
  readonly children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html
    className={cn(fonts, "dark scroll-smooth")}
    lang="en"
    suppressHydrationWarning
  >
    <body className="min-h-screen">
      <Background />
      <BaseProvider>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </BaseProvider>
    </body>
  </html>
);

export default RootLayout;

export const metadata: Metadata = {
  title: "Opentribe Admin | Platform Administration",
  description:
    "Superadmin platform for managing users, organizations, grants, bounties, and ecosystem profiles in the Opentribe ecosystem.",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E6007A",
};
