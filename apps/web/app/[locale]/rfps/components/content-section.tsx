'use client'

import React from 'react'
import { Button } from "@packages/base/components/ui/button"
import { Skeleton } from "@packages/base/components/ui/skeleton"
import { RFPCard } from "../../components/cards/rfp-card"
import { TopBountiesCard } from "./top-bounties"

interface RFP {
  id: string;
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

interface TopBounty {
  id: string
  title: string
  voteCount: number
  organization: {
    name: string
  }
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
        <div className='rounded-xl border border-white/10 bg-white/5 p-12 text-center'>
          <div className='mb-4 text-6xl text-white/60'>🔍</div>
          <h3 className='mb-2 font-heading font-semibold text-white text-xl'>
            No RFPs found
          </h3>
          <p className='mb-6 text-white/60'>
            {activeFiltersCount > 0
              ? 'Try adjusting your filters to see more RFPs.'
              : 'There are no RFPs available at the moment.'}
          </p>
          {activeFiltersCount > 0 && (
            <Button
              onClick={onClearAllFilters}
              className="bg-pink-500 hover:bg-pink-600"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      )}

      {/* RFPs List */}
      {!loading && rfps.length > 0 && (
        <>
          <div>
            {rfps.map((rfp, index) => (
              <div key={rfp.id} className={index > 0 ? "mt-6" : ""}>
                <RFPCard
                  id={rfp.id}
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
      <div className="mt-6 lg:hidden">
        <TopBountiesCard
          topBounties={topBounties}
          topBountiesLoading={topBountiesLoading}
          topBountiesError={topBountiesError}
        />
      </div>
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
