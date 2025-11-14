import "@/app/global.css"
import { fonts } from "@packages/base/lib/fonts"
import { RootProvider } from "fumadocs-ui/provider"
import type { ReactNode } from "react"

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" className={`${fonts} dark`} suppressHydrationWarning>
            <body className="flex min-h-screen flex-col">
                <RootProvider
                    theme={{
                        enabled: false,
                        defaultTheme: "dark",
                        forcedTheme: "dark"
                    }}
                >
                    {children}
                </RootProvider>
            </body>
        </html>
    )
}
