"use client";

import Link from "next/link";
import { Skeleton } from "@packages/base/components/ui/skeleton";
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
      <div className='mb-6 flex items-center justify-between'>
        <h2 className='font-bold font-heading text-2xl text-white'>{title}</h2>
        <Link
          href={viewAllHref}
          className='text-pink-400 transition-colors hover:text-pink-300'
        >
          View All →
        </Link>
      </div>

      {error ? (
        <div className='rounded-lg border border-red-500/20 bg-red-500/10 p-6'>
          <p className="text-red-400">Failed to load {title.toLowerCase()}</p>
          <p className='mt-1 text-red-300/80 text-sm'>{error.message}</p>
        </div>
      ) : loading ? (
        <div className={gridClassName}>
          {title === "Grants"
            ? // Grants loading skeleton (card grid)
              [1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton
                  key={i}
                  className="h-[466px] rounded-2xl"
                />
              ))
            : title === "RFPs"
              ? // RFPs loading skeleton (list items)
                [1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-32 rounded-lg"
                  />
                ))
              : // Bounties loading skeleton (list items)
                [1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-48 rounded-lg"
                  />
                ))}
        </div>
      ) : items.length === 0 ? (
        <div className='rounded-lg border border-white/10 bg-white/5 p-6'>
          <p className='text-center text-white/60'>{emptyMessage}</p>
        </div>
      ) : (
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
  return (
    <div className="space-y-12">
      {/* Bounties Section */}
      {bounties.length > 0 || loading.bounties || error.bounties ? (
        <ContentBlock
          title="Bounties"
          viewAllHref="/en/bounties"
          items={bounties}
          loading={loading.bounties}
          error={error.bounties}
          renderItem={(bounty) => (
            <BountyCard
              key={bounty.id}
              id={bounty.id}
              slug={bounty.slug}
              title={bounty.title}
              organization={bounty.organization || "Unknown Organization"}
              amount={
                typeof bounty.amount === "string"
                  ? Number.parseFloat(bounty.amount)
                  : (bounty.amount ?? 0)
              }
              amountUSD={bounty.amountUSD}
              token={bounty.token || "DOT"}
              deadline={bounty.deadline}
              submissionCount={bounty.submissionCount || 0}
              status={bounty.status || "OPEN"}
              description={bounty.description || "No description available"}
              skills={bounty.skills}
              createdAt={bounty.createdAt || new Date().toISOString()}
              winnersAnnouncedAt={bounty.winnersAnnouncedAt}
            />
          )}
          emptyMessage="No bounties available"
        />
      ) : null}

      {/* Grants Section */}
      {grants.length > 0 || loading.grants || error.grants ? (
        <ContentBlock
          title="Grants"
          viewAllHref="/en/grants"
          items={grants}
          loading={loading.grants}
          error={error.grants}
          gridClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6"
          renderItem={(grant) => (
            <GrantCard
              key={grant.id}
              id={grant.id}
              title={grant.title}
              organization={grant.organization}
              bannerUrl={grant.bannerUrl}
              minAmount={grant.minAmount}
              maxAmount={grant.maxAmount}
              token={grant.token}
              rfpCount={grant.rfpCount}
              applicationCount={grant.applicationCount}
              status={grant.status}
              summary={grant.summary}
              skills={grant.skills}
              createdAt={grant.createdAt}
            />
          )}
          emptyMessage="No grants available"
        />
      ) : null}

      {/* RFPs Section */}
      {rfps.length > 0 || loading.rfps || error.rfps ? (
        <ContentBlock
          title="RFPs"
          viewAllHref="/en/rfps"
          items={rfps}
          loading={loading.rfps}
          error={error.rfps}
          gridClassName="space-y-4"
          renderItem={(rfp) => (
            <RFPCard
              key={rfp.id}
              id={rfp.id}
              title={rfp.title}
              grant={rfp.grant}
              voteCount={rfp.voteCount}
              commentCount={rfp.commentCount}
              status={rfp.status}
              description={rfp.description}
            />
          )}
          emptyMessage="No RFPs available"
        />
      ) : null}
    </div>
  );
}
