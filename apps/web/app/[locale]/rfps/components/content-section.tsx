"use client";

import { Button } from "@packages/base/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@packages/base/components/ui/empty";
import { Skeleton } from "@packages/base/components/ui/skeleton";
import React from "react";
import { RFPCard } from "../../components/cards/rfp-card";
import { TopBountiesCard, type TopBounty } from "./top-bounties";

interface RFP {
  id: string;
  slug: string;
  title: string;
  description: string;
  grant: {
    id: string;
    title: string;
    organization: {
      id: string;
      name: string;
      slug: string;
      logo: string | null;
    };
  };
  voteCount: number;
  commentCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface RfpsFilters {
  search: string;
  status: string[];
  sort: string;
  grant: string;
  submission: string;
}

interface RfpsContentSectionProps {
  rfps: RFP[];
  loading: boolean;
  error: Error | null;
  filters: RfpsFilters;
  hasMore: boolean;
  isLoadingMore: boolean;
  activeFiltersCount: number;
  onClearAllFilters: () => void;
  onLoadMore: () => void;
  onRetry: () => void;
  topBounties: TopBounty[];
  topBountiesLoading: boolean;
  topBountiesError: Error | null;
}

function RfpsContentSectionComponent({
  rfps,
  loading,
  error,
  hasMore,
  isLoadingMore,
  activeFiltersCount,
  onClearAllFilters,
  onLoadMore,
  onRetry,
  topBounties,
  topBountiesLoading,
  topBountiesError,
}: RfpsContentSectionProps) {
  return (
    <div className="lg:col-span-3">
      {/* Error State */}
      {error && (
        <div
          aria-live="polite"
          className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-6"
          role="alert"
        >
          <div className="mb-2 font-semibold text-red-400">
            Error loading RFPs
          </div>
          <div className="mb-4 text-red-300 text-sm">
            {error.message ||
              "Something went wrong while loading RFPs. Please try again."}
          </div>
          <div className="flex gap-3">
            <Button
              aria-label="Retry loading RFPs"
              className="bg-red-500 hover:bg-red-600"
              onClick={onRetry}
            >
              Try Again
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                aria-label="Clear all active filters"
                className="border-red-500/20 text-red-300 hover:bg-red-500/10"
                onClick={onClearAllFilters}
                variant="outline"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && rfps.length === 0 && (
        <div aria-label="Loading RFPs" className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton aria-hidden="true" className="h-32 rounded-xl" key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!(loading || error) && rfps.length === 0 && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>No RFPs found</EmptyTitle>
            <EmptyDescription>
              {activeFiltersCount > 0
                ? "Try adjusting your filters to see more RFPs."
                : "There are no RFPs available at the moment."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {/* RFPs List */}
      {!loading && rfps.length > 0 && (
        <>
          <div>
            {rfps.map((rfp, index) => (
              <div className={index > 0 ? "mt-6" : ""} key={rfp.id}>
                <RFPCard
                  commentCount={rfp.commentCount}
                  description={rfp.description}
                  grant={{
                    title: rfp.grant.title,
                    organization: {
                      name: rfp.grant.organization.name,
                      logo: rfp.grant.organization.logo || undefined,
                    },
                  }}
                  id={rfp.id}
                  slug={rfp.slug}
                  status={rfp.status as "OPEN" | "CLOSED"}
                  title={rfp.title}
                  variant="list"
                  voteCount={rfp.voteCount}
                />
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-8 text-center">
              <Button
                aria-label={
                  isLoadingMore ? "Loading more RFPs" : "Load more RFPs"
                }
                className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
                disabled={isLoadingMore}
                onClick={onLoadMore}
                variant="outline"
              >
                {isLoadingMore ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Loading more RFPs...
                  </div>
                ) : (
                  "View More →"
                )}
              </Button>
            </div>
          )}

          {/* Top Bounties - Mobile Only */}
          <TopBountiesCard
            className="mt-6 lg:hidden"
            topBounties={topBounties}
            topBountiesError={topBountiesError}
            topBountiesLoading={topBountiesLoading}
          />
        </>
      )}

      {/* Loading More State */}
      {loading && rfps.length > 0 && (
        <div aria-label="Loading more RFPs" className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton
              aria-hidden="true"
              className="h-32 rounded-xl"
              key={`loading-${i}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Memoize the component for performance
export const RfpsContentSection = React.memo(RfpsContentSectionComponent);
