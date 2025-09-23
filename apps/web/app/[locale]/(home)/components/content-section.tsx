"use client";

import React from "react";
import Link from "next/link";
import { Button as BaseButton } from "@packages/base/components/ui/button";
import { Badge } from "@packages/base/components/ui/badge";
import { BountyCard } from "../../components/cards/bounty-card";
import { GrantCard } from "../../components/cards/grant-card";
import { RFPCard } from "../../components/cards/rfp-card";

// Safe Button wrapper for React 19 compatibility
const Button = (props: any) => {
  const { children, onClick, variant, size, className } = props;
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 font-medium text-sm transition-colors ${
        variant === "ghost"
          ? "hover:bg-white/10 hover:text-white"
          : variant === "outline"
            ? "border border-white/20 text-white hover:bg-white/10"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
      } ${size === "sm" ? "px-2 py-1 text-xs" : ""} ${className || ""}`}
    >
      {children}
    </button>
  );
};

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
  hasActiveFilters: boolean;
  onClearFilters: () => void;
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
                <div
                  key={i}
                  className="h-[466px] bg-white/5 rounded-2xl animate-pulse"
                />
              ))
            : title === "RFPs"
              ? // RFPs loading skeleton (list items)
                [1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-white/5 rounded-lg animate-pulse"
                  />
                ))
              : // Bounties loading skeleton (list items)
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-48 bg-white/5 rounded-lg animate-pulse"
                  />
                ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
          <p className="text-white/60 text-center">{emptyMessage}</p>
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
  selectedSkills,
  hasActiveFilters,
  onClearFilters,
}: ContentSectionProps) {
  return (
    <div className="space-y-12">
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className='flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4'>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">Filtering by:</span>
            <div className='flex flex-wrap gap-1'>
              {selectedSkills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className='border-[#E6007A]/30 bg-[#E6007A]/20 text-white'
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className='text-white/60 hover:bg-white/10 hover:text-white'
          >
            Clear filters
          </Button>
        </div>
      )}

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
          emptyMessage={
            hasActiveFilters
              ? `No bounties found for selected skills: ${selectedSkills.join(", ")}`
              : "No bounties available"
          }
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
          gridClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
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
          emptyMessage={
            hasActiveFilters
              ? `No grants found for selected skills: ${selectedSkills.join(", ")}`
              : "No grants available"
          }
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
