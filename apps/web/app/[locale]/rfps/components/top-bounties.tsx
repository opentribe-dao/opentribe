"use client";

import { Skeleton } from "@packages/base/components/ui/skeleton";
import { cn } from "@packages/base/lib/utils";
import Link from "next/link";
import React from "react";

export interface TopBounty {
  id: string;
  slug: string;
  title: string;
  voteCount: number;
  organization: {
    name: string;
  };
}

interface TopBountiesProps {
  topBounties: TopBounty[];
  topBountiesLoading: boolean;
  topBountiesError: Error | null;
  className?: string;
}

const getGradientClass = (index: number) => {
  switch (index) {
    case 0:
      return "from-yellow-500 to-orange-600";
    case 1:
      return "from-gray-400 to-gray-600";
    case 2:
      return "from-amber-600 to-yellow-700";
    default:
      return "from-pink-500 to-purple-600";
  }
};

export function TopBountiesCard({
  topBounties,
  topBountiesLoading,
  topBountiesError,
  className = "",
}: TopBountiesProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm",
        className
      )}
    >
      <h3 className="mb-4 font-heading font-semibold text-lg">Top Bounties</h3>

      {topBountiesLoading && (
        <div aria-label="Loading top bounties" className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              aria-hidden="true"
              className="flex items-center gap-3 rounded-lg p-2"
              key={i}
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="mb-1 h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      )}

      {topBountiesError && (
        <div
          aria-live="polite"
          className="rounded-lg border border-red-500/20 bg-red-500/10 p-4"
          role="alert"
        >
          <div className="font-medium text-red-400 text-sm">
            Error loading bounties
          </div>
          <div className="mt-1 text-red-300 text-xs">
            {topBountiesError.message || "Failed to load top bounties"}
          </div>
        </div>
      )}

      {!(topBountiesLoading || topBountiesError) &&
        topBounties.length === 0 && (
          <div className="py-4 text-center">
            <div className="text-sm text-white/40">No bounties available</div>
          </div>
        )}

      {!(topBountiesLoading || topBountiesError) && topBounties.length > 0 && (
        <div className="space-y-3">
          {topBounties.map((bounty, index) => (
            <Link
              aria-label={`View bounty: ${bounty.title} by ${bounty.organization.name}`}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5"
              href={`/bounties/${bounty.slug || bounty.id}`}
              key={bounty.slug || bounty.id}
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getGradientClass(index)}`}
              >
                <span className="font-bold font-heading text-sm text-white">
                  {index + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="line-clamp-1 font-medium text-sm text-white">
                  {bounty.title}
                </h4>
                <p className="truncate text-white/50 text-xs">
                  {bounty.organization.name}
                </p>
              </div>
              <div className="flex items-center gap-1 text-white/60 text-xs">
                <span>{bounty.voteCount}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default React.memo(TopBountiesCard);
