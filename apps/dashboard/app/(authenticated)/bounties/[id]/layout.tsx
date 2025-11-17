"use client";

import { Button } from "@packages/base/components/ui/button";
import { ShareButton } from "@packages/base/components/ui/share-button";
import { Edit2, Loader2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import router from "next/router";
import { use } from "react";
import { env } from "@/env";
import {
  BountyProvider,
  useBountyContext,
} from "../../components/bounty-provider";
import { Header } from "../../components/header";
import { PaymentModal } from "./payment-modal";
import { Badge } from "@packages/base/components/ui/badge";

const BOUNTY_REGEX = /^\/bounties\/[^/]+\/submissions\/[^/]+$/;

export default function BountyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();

  if (pathname.endsWith("/edit") || BOUNTY_REGEX.test(pathname)) {
    return <BountyProvider bountyId={id}>{children}</BountyProvider>;
  }
  return (
    <BountyProvider bountyId={id}>
      <BountyLayoutBody>{children}</BountyLayoutBody>
    </BountyProvider>
  );
}

function BountyLayoutBody({ children }: { children: React.ReactNode }) {
  const { bounty, bountyLoading, bountyError, selectedPaymentSubmission } =
    useBountyContext();

  const pathname = usePathname();

  if (bountyLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (bountyError || !bounty) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="mb-4 font-semibold text-2xl text-white">
          Bounty not found
        </h1>
        <Button
          className="border-white/20 text-white hover:bg-white/10"
          onClick={() => router.push("/bounties")}
          variant="outline"
        >
          Back to Bounties
        </Button>
      </div>
    );
  }

  // Tab links
  const tabs = [
    { name: "Overview", href: `/bounties/${bounty.id}/` },
    { name: "Submissions", href: `/bounties/${bounty.id}/submissions` },
    { name: "Settings", href: `/bounties/${bounty.id}/settings` },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "OPEN":
      case "ACTIVE":
        return "bg-green-500/20 text-green-400 border-0";
      case "REVIEWING":
        return "bg-yellow-500/20 text-yellow-400 border-0";
      case "CLOSED":
      case "COMPLETED":
        return "bg-blue-500/20 text-blue-400 border-0";
      default:
        return "bg-gray-500/20 text-gray-400 border-0";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case "OPEN":
        return "OPEN";
      case "ACTIVE":
        return "ACTIVE";
      case "REVIEWING":
        return "REVIEWING";
      case "CLOSED":
        return "CLOSED";
      case "COMPLETED":
        return "COMPLETED";
      default:
        return "DRAFT";
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility.toUpperCase()) {
      case "PUBLISHED":
        return "bg-transparent text-green-400 border-0";
      case "DRAFT":
        return "bg-transparent text-yellow-400 border-0";
      case "ARCHIVED":
        return "bg-transparent text-gray-400 border-0";
      default:
        return "bg-transparent text-white/60 border-0";
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility.toUpperCase()) {
      case "PUBLISHED":
        return "PUBLISHED";
      case "DRAFT":
        return "DRAFT";
      case "ARCHIVED":
        return "ARCHIVED";
      default:
        return visibility;
    }
  };

  return (
    <>
      <Header page={bounty.title} pages={["Overview", "Bounties"]} />
      <div className="flex min-h-screen flex-col gap-6 p-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-3xl text-white">
                {bounty.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                className="border-white/20 text-white hover:bg-white/10"
                size="sm"
                variant="outline"
              >
                <Link
                  className="flex items-center gap-2"
                  href={`/bounties/${bounty.id}/edit`}
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Bounty
                </Link>
              </Button>
              <ShareButton
                size="sm"
                url={`${env.NEXT_PUBLIC_WEB_URL}/bounties/${bounty.id}`}
              />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
            <span>by {bounty.organization.name}</span>
            <span>•</span>
            <span>
              {new Date(
                bounty.publishedAt || bounty.createdAt
              ).toLocaleDateString()}
            </span>
            <span>•</span>
            <Badge className={getStatusColor(bounty.status)}>
              {getStatusLabel(bounty.status)}
            </Badge>
            <span>•</span>
            <Badge className={getVisibilityColor(bounty.visibility)}>
              {getVisibilityLabel(bounty.visibility)}
            </Badge>
          </div>
        </div>
        {/* Tab Navigation */}
        <div className="mt-6 flex gap-2">
          {tabs.map((tab) => (
            <Link
              className={
                "rounded-t bg-white/5 px-4 py-2 text-white/80 transition hover:bg-white/10 data-[active=true]:bg-zinc-950 data-[active=true]:text-white"
              }
              data-active={
                typeof window !== "undefined" &&
                (pathname === tab.href ||
                  (tab.name === "Overview" &&
                    pathname === `/bounties/${bounty.id}/`))
              }
              href={tab.href}
              key={tab.name}
              prefetch={false}
            >
              {tab.name}
            </Link>
          ))}
        </div>
        {/* Tab Content */}
        <div className="flex-1 p-6">{children}</div>

        {/* Payment Modal */}
        {selectedPaymentSubmission && bounty && <PaymentModal />}
      </div>
    </>
  );
}
