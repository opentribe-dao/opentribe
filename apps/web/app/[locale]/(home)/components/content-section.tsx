"use client";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@packages/base/components/ui/empty";
import { Skeleton } from "@packages/base/components/ui/skeleton";
import Link from "next/link";
import type React from "react";
import { BountyCard } from "../../components/cards/bounty-card";
import { GrantCard } from "../../components/cards/grant-card";
import { RFPCard } from "../../components/cards/rfp-card";

interface ContentSectionProps {
  bounties: any[];
  grants: any[];
  rfps: any[];
  loading: {
    bounties: boolean;
    grants: boolean;
    rfps: boolean;
  };
  error: {
    bounties: Error | null;
    grants: Error | null;
    rfps: Error | null;
  };
  selectedSkills: string[];
}

interface ContentBlockProps {
  title: string;
  viewAllHref: string;
  items: any[];
  loading: boolean;
  error: Error | null;
  renderItem: (item: any) => React.ReactNode;
  emptyMessage: string;
  gridClassName?: string;
}

function ContentBlock({
  title,
  viewAllHref,
  items,
  loading,
  error,
  renderItem,
  emptyMessage,
  gridClassName = "grid gap-4",
}: ContentBlockProps) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-bold font-heading text-2xl text-white">{title}</h2>
        <Link
          className="text-pink-400 transition-colors hover:text-pink-300"
          href={viewAllHref}
        >
          View All →
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6">
          <p className="text-red-400">Failed to load {title.toLowerCase()}</p>
          <p className="mt-1 text-red-300/80 text-sm">{error.message}</p>
        </div>
      ) : loading ? (
        <div className={gridClassName}>
          {title === "Grants"
            ? // Grants loading skeleton (card grid)
              [1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton className="h-[466px] rounded-2xl" key={i} />
              ))
            : title === "RFPs"
              ? // RFPs loading skeleton (list items)
                [1, 2].map((i) => (
                  <Skeleton className="h-32 rounded-lg" key={i} />
                ))
              : // Bounties loading skeleton (list items)
                [1, 2, 3].map((i) => (
                  <Skeleton className="h-48 rounded-lg" key={i} />
                ))}
        </div>
      ) : items.length === 0 ? null : (
        <div className={gridClassName}>{items.map(renderItem)}</div>
      )}
    </div>
  );
}

export function ContentSection({
  bounties,
  grants,
  rfps,
  loading,
  error,
}: ContentSectionProps) {
  const allEmpty =
    bounties.length === 0 && grants.length === 0 && rfps.length === 0;

  return (
    <div className="space-y-12">
      {allEmpty && !loading.bounties && !loading.grants && !loading.rfps ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>No results</EmptyTitle>
            <EmptyDescription>
              There are no bounties, grants, or RFPs to show right now.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      ) : (
        <>
          {/* Bounties Section */}
          {bounties.length > 0 || loading.bounties || error.bounties ? (
            <ContentBlock
              emptyMessage="No bounties available"
              error={error.bounties}
              items={bounties}
              loading={loading.bounties}
              renderItem={(bounty) => (
                <BountyCard
                  amount={
                    typeof bounty.amount === "string"
                      ? Number.parseFloat(bounty.amount)
                      : (bounty.amount ?? 0)
                  }
                  amountUSD={bounty.amountUSD}
                  createdAt={bounty.createdAt || new Date().toISOString()}
                  deadline={bounty.deadline}
                  description={bounty.description || "No description available"}
                  id={bounty.id}
                  key={bounty.id}
                  organization={bounty.organization || "Unknown Organization"}
                  skills={bounty.skills}
                  slug={bounty.slug}
                  status={bounty.status || "OPEN"}
                  submissionCount={bounty.submissionCount || 0}
                  title={bounty.title}
                  token={bounty.token || "DOT"}
                  winnersAnnouncedAt={bounty.winnersAnnouncedAt}
                />
              )}
              title="Bounties"
              viewAllHref="/en/bounties"
            />
          ) : null}

          {/* Grants Section */}
          {grants.length > 0 || loading.grants || error.grants ? (
            <ContentBlock
              emptyMessage="No grants available"
              error={error.grants}
              gridClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6"
              items={grants}
              loading={loading.grants}
              renderItem={(grant) => (
                <GrantCard
                  applicationCount={grant.applicationCount}
                  bannerUrl={grant.bannerUrl}
                  createdAt={grant.createdAt}
                  id={grant.id}
                  key={grant.id}
                  maxAmount={grant.maxAmount}
                  minAmount={grant.minAmount}
                  organization={grant.organization}
                  rfpCount={grant.rfpCount}
                  skills={grant.skills}
                  slug={grant.slug}
                  status={grant.status}
                  summary={grant.summary}
                  title={grant.title}
                  token={grant.token}
                />
              )}
              title="Grants"
              viewAllHref="/en/grants"
            />
          ) : null}

          {/* RFPs Section */}
          {rfps.length > 0 || loading.rfps || error.rfps ? (
            <ContentBlock
              emptyMessage="No RFPs available"
              error={error.rfps}
              gridClassName="space-y-4"
              items={rfps}
              loading={loading.rfps}
              renderItem={(rfp) => (
                <RFPCard
                  commentCount={rfp.commentCount}
                  description={rfp.description}
                  grant={rfp.grant}
                  id={rfp.id}
                  key={rfp.id}
                  slug={rfp.slug}
                  status={rfp.status}
                  title={rfp.title}
                  voteCount={rfp.voteCount}
                />
              )}
              title="RFPs"
              viewAllHref="/en/rfps"
            />
          ) : null}
        </>
      )}
    </div>
  );
}
