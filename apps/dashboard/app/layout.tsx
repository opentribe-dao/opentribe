import "./styles.css";
import { BaseProvider, Background } from "@packages/base";
import { fonts } from "@packages/base/lib/fonts";
import { cn } from "@packages/base/lib/utils";
import { Toolbar } from "@packages/feature-flags/components/toolbar";
import { AnalyticsProvider } from "@packages/analytics";
import type { ReactNode } from "react";
import ReactQueryProvider from "../components/react-query-provider";
import type { Metadata, Viewport } from "next";

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

export const metadata: Metadata = {
  title: "Opentribe Dashboard | Empower Polkadot Builders",
  description: "Your platform to create and manage grants, bounties, and RFPs in the Polkadot ecosystem. Discover talent, fund innovation, and drive ecosystem growth.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Opentribe Dashboard | Empower Polkadot Builders",
    description: "Your platform to create and manage grants, bounties, and RFPs in the Polkadot ecosystem. Discover talent, fund innovation, and drive ecosystem growth.",
    type: "website",
    siteName: "Opentribe Dashboard",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Opentribe Dashboard - Empower Polkadot Builders & Drive Impact",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Opentribe Dashboard | Empower Polkadot Builders",
    description: "Your platform to create and manage grants, bounties, and RFPs in the Polkadot ecosystem. Discover talent, fund innovation, and drive ecosystem growth.",
    images: ["/api/og"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#E6007A",
};
