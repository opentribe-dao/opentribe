'use client'

import React from 'react'
import { Button } from "@packages/base/components/ui/button"
import { Skeleton } from "@packages/base/components/ui/skeleton"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@packages/base/components/ui/empty"
import { RFPCard } from "../../components/cards/rfp-card"
import {  type TopBounty, TopBountiesCard } from "./top-bounties"

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
  search: string
  status: string[]
  sort: string
  grant: string
  submission: string
}

interface RfpsContentSectionProps {
  rfps: RFP[]
  loading: boolean
  error: Error | null
  filters: RfpsFilters
  hasMore: boolean
  isLoadingMore: boolean
  activeFiltersCount: number
  onClearAllFilters: () => void
  onLoadMore: () => void
  onRetry: () => void
  topBounties: TopBounty[]
  topBountiesLoading: boolean
  topBountiesError: Error | null
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
  topBountiesError
}: RfpsContentSectionProps) {
  return (
    <div className="lg:col-span-3">
      {/* Error State */}
      {error && (
        <div 
          className='mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-6'
          role="alert"
          aria-live="polite"
        >
          <div className='mb-2 font-semibold text-red-400'>Error loading RFPs</div>
          <div className='mb-4 text-red-300 text-sm'>
            {error.message || 'Something went wrong while loading RFPs. Please try again.'}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onRetry}
              className="bg-red-500 hover:bg-red-600"
              aria-label="Retry loading RFPs"
            >
              Try Again
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                onClick={onClearAllFilters}
                className="border-red-500/20 text-red-300 hover:bg-red-500/10"
                aria-label="Clear all active filters"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && rfps.length === 0 && (
        <div className="space-y-4" aria-label="Loading RFPs">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              className="h-32 rounded-xl"
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && rfps.length === 0 && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>No RFPs found</EmptyTitle>
            <EmptyDescription>
              {activeFiltersCount > 0
                ? 'Try adjusting your filters to see more RFPs.'
                : 'There are no RFPs available at the moment.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {/* RFPs List */}
      {!loading && rfps.length > 0 && (
        <>
          <div>
            {rfps.map((rfp, index) => (
              <div key={rfp.id} className={index > 0 ? "mt-6" : ""}>
                <RFPCard
                  id={rfp.id}
                  slug={rfp.slug}
                  title={rfp.title}
                  grant={{
                    title: rfp.grant.title,
                    organization: {
                      name: rfp.grant.organization.name,
                      logo: rfp.grant.organization.logo || undefined,
                    }
                  }}
                  voteCount={rfp.voteCount}
                  commentCount={rfp.commentCount}
                  status={rfp.status as "OPEN" | "CLOSED"}
                  description={rfp.description}
                  variant="list"
                />
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-8 text-center">
              <Button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
                aria-label={isLoadingMore ? "Loading more RFPs" : "Load more RFPs"}
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
          topBounties={topBounties}
          topBountiesLoading={topBountiesLoading}
          topBountiesError={topBountiesError}
          className='mt-6 lg:hidden'
        />
        </>
      )}

      {/* Loading More State */}
      {loading && rfps.length > 0 && (
        <div className="mt-6 space-y-4" aria-label="Loading more RFPs">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={`loading-${i}`}
              className="h-32 rounded-xl"
              aria-hidden="true"
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Memoize the component for performance
export const RfpsContentSection = React.memo(RfpsContentSectionComponent)
