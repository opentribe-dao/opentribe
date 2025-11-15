import {
    ArrowRight,
    Book,
    CheckCircle,
    Code2,
    Rocket,
    Shield,
    Users,
    Zap
} from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

export default function HomePage() {
    return (
        <main className="flex flex-1 flex-col">
            {/* Hero Section */}
            <section className="container mx-auto flex flex-col items-center justify-center gap-6 py-24 text-center">
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1 text-sm">
                    <Zap className="h-4 w-4" />
                    Talent Marketplace for Polkadot
                </div>

                <h1 className="max-w-4xl font-bold text-5xl tracking-tight sm:text-6xl">
                    Welcome to{" "}
                    <span className="bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent">
                        Opentribe
                    </span>{" "}
                    Documentation
                </h1>

                <p className="max-w-2xl text-fd-muted-foreground text-lg">
                    The complete guide to using Opentribe - connecting builders with opportunities across the Polkadot ecosystem through grants, bounties, and RFPs.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4">
                    <Link
                        href="/docs"
                        className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-6 py-3 font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
                    >
                        Get Started
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                        href="/docs/payments/overview"
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-6 py-3 font-medium backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20"
                    >
                        <Zap className="h-4 w-4" />
                        How Payments Work
                    </Link>
                </div>
            </section>

            {/* Features Grid */}
            <section className="container mx-auto py-16">
                <h2 className="mb-12 text-center font-bold text-3xl">
                    Everything you need to get started
                </h2>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <FeatureCard
                        icon={<Rocket className="h-6 w-6" />}
                        title="For Builders"
                        description="Find grants, bounties, and RFPs across the Polkadot ecosystem in one place."
                    />
                    <FeatureCard
                        icon={<Users className="h-6 w-6" />}
                        title="For Organizations"
                        description="Post bounties, manage submissions, and discover talent for your project."
                    />
                    <FeatureCard
                        icon={<Zap className="h-6 w-6" />}
                        title="Asset Hub Payments"
                        description="Share a Polkadot address and get paid in DOT or any registered Asset Hub asset."
                    />
                    <FeatureCard
                        icon={<CheckCircle className="h-6 w-6" />}
                        title="Multi-Winner Bounties"
                        description="Create bounties that reward multiple contributors, not just one winner."
                    />
                    <FeatureCard
                        icon={<Book className="h-6 w-6" />}
                        title="Comprehensive API"
                        description="Integrate Opentribe into your workflows with our REST API."
                    />
                    <FeatureCard
                        icon={<Shield className="h-6 w-6" />}
                        title="Wallet Linking"
                        description="Keep your payout wallets on file while signing in with email, Google, or GitHub."
                    />
                </div>
            </section>

            {/* Quick Links */}
            <section className="container mx-auto border-t border-white/5 py-16">
                <h2 className="mb-8 text-center font-bold text-2xl">
                    Popular Documentation
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <QuickLink
                        href="/docs/getting-started/for-builders"
                        title="For Builders"
                        description="Start finding opportunities"
                    />
                    <QuickLink
                        href="/docs/getting-started/for-organizations"
                        title="For Organizations"
                        description="Post your first bounty"
                    />
                    <QuickLink
                        href="/docs/payments/overview"
                        title="Payment System"
                        description="How direct payments work"
                    />
                </div>
            </section>
        </main>
    )
}

function FeatureCard({
    icon,
    title,
    description
}: {
    icon: ReactNode
    title: string
    description: string
}) {
    return (
        <div className="flex flex-col gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm transition-all hover:bg-white/[0.04] hover:border-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500">
                {icon}
            </div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-fd-muted-foreground text-sm">{description}</p>
        </div>
    )
}

function QuickLink({
    href,
    title,
    description
}: {
    href: string
    title: string
    description: string
}) {
    return (
        <Link
            href={href}
            className="group flex flex-col gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm transition-all hover:bg-white/[0.04] hover:border-white/10"
        >
            <div className="flex items-center justify-between">
                <h3 className="font-medium">{title}</h3>
                <ArrowRight className="h-4 w-4 text-fd-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
            <p className="text-fd-muted-foreground text-sm">{description}</p>
        </Link>
    )
}
