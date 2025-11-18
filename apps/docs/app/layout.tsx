import "@/app/global.css"
import { fonts } from "@packages/base/lib/fonts"
import { AnalyticsProvider } from "@packages/analytics"
import { RootProvider } from "fumadocs-ui/provider"
import type { ReactNode } from "react"
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
    title: "Opentribe Docs | Documentation",
    description: "Comprehensive documentation for Opentribe - the talent marketplace connecting builders with grants, bounties, and RFPs across the Polkadot ecosystem. Learn how to get started, integrate our API, and manage opportunities.",
    keywords: ["opentribe docs", "opentribe documentation", "polkadot marketplace", "web3 docs", "bounty platform", "grant platform", "RFP platform", "developer docs", "API documentation", "blockchain marketplace"],
    authors: [{ name: "Opentribe", url: "https://opentribe.io" }],
    creator: "Opentribe",
    publisher: "Opentribe",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL("https://docs.opentribe.io"),
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: "Opentribe Docs | Documentation",
        description: "Comprehensive documentation for Opentribe - the talent marketplace for Polkadot ecosystem",
        url: "https://docs.opentribe.io",
        siteName: "Opentribe Docs",
        images: [
            {
                url: "/opengraph-image",
                width: 1200,
                height: 630,
                alt: "Opentribe Documentation",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Opentribe Docs | Documentation",
        description: "Comprehensive documentation for Opentribe - the talent marketplace for Polkadot ecosystem",
        creator: "@opentribe_io",
        images: ["/opengraph-image"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
}

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#E6007A", // Polkadot pink
}

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" className={`${fonts} dark`} suppressHydrationWarning>
            <body className="flex min-h-screen flex-col">
                <AnalyticsProvider>
                    <RootProvider
                        theme={{
                            enabled: false,
                            defaultTheme: "dark",
                            forcedTheme: "dark"
                        }}
                    >
                        {children}
                    </RootProvider>
                </AnalyticsProvider>
            </body>
        </html>
    )
}
