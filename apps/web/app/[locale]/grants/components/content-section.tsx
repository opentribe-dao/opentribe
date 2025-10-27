'use client'

import React from 'react'
import { Button } from "@packages/base/components/ui/button"
import { Skeleton } from "@packages/base/components/ui/skeleton"
import { GrantCard } from "../../components/cards/grant-card"
import { type TopRFP, TopRFPsCard } from "./top-rfps"
import type { Grant } from '@/hooks/use-grants-data'
import { getSkillLabel } from '@packages/base/lib/skills'

interface GrantFilters {
  status: string[]
  sortBy: string
  priceRange: [number, number]
}

interface GrantsContentSectionProps {
  grants: Grant[]
  loading: boolean
  error: Error | null
  selectedSkills: string[]
  skillsOptions: string[]
  filters: GrantFilters
  hasMore: boolean
  isLoadingMore: boolean
  activeFiltersCount: number
  onSkillToggle: (skill: string) => void
  onClearAllFilters: () => void
  onLoadMore: () => void
  onRetry: () => void
  topRFPs: TopRFP[]
  topRFPsLoading: boolean
  topRFPsError: Error | null
}

function GrantsContentSectionComponent({
  grants,
  loading,
  error,
  selectedSkills,
  skillsOptions,
  hasMore,
  isLoadingMore,
  activeFiltersCount,
  onSkillToggle,
  onClearAllFilters,
  onLoadMore,
  onRetry,
  topRFPs,
  topRFPsLoading,
  topRFPsError
}: GrantsContentSectionProps) {
  return (
    <div className="lg:col-span-3">
      <div className="mb-4">
        <div className="relative">
          <div className='scrollbar-hide flex gap-2 overflow-x-auto py-2'>
            {loading && skillsOptions.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className='h-8 w-24 flex-shrink-0 animate-pulse rounded-lg bg-white/10'
                  />
                ))
              : skillsOptions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => onSkillToggle(skill)}
                    className={`flex-shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 font-medium text-sm transition-all duration-200 ${
                      selectedSkills.includes(skill)
                        ? 'border-pink-400 bg-pink-500/20 text-pink-300'
                        : 'border-white/20 bg-white/10 text-white/70 hover:border-pink-400/50 hover:bg-white/20'
                    }`}
                    aria-pressed={selectedSkills.includes(skill)}
                    aria-label={`Filter by ${skill} skill`}
                  >
                    {getSkillLabel(skill)}
                  </button>
                ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className='mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-6'>
          <div className='mb-2 font-semibold text-red-400'>Error loading grants</div>
          <div className='mb-4 text-red-300 text-sm'>
            {error.message || 'Something went wrong while loading grants. Please try again.'}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onRetry}
              className="bg-red-500 hover:bg-red-600"
            >
              Try Again
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                onClick={onClearAllFilters}
                className="border-red-500/20 text-red-300 hover:bg-red-500/10"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && grants.length === 0 && (
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-1'>
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-[466px] rounded-2xl"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && grants.length === 0 && (
        <div className='rounded-xl border border-white/10 bg-white/5 p-12 text-center'>
          <div className='mb-4 text-6xl text-white/60'>🔍</div>
          <h3 className='mb-2 font-heading font-semibold text-white text-xl'>
            No grants found
          </h3>
          <p className='mb-6 text-white/60'>
            {activeFiltersCount > 0
              ? 'Try adjusting your filters to see more grants.'
              : 'There are no grants available at the moment.'}
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

      {/* Grants Grid */}
      {!loading && grants.length > 0 && (
        <>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-1 xl:grid-cols-1'>
            {grants.map((grant) => (
              <GrantCard
                key={grant.id}
                id={grant.id}
                slug={grant.slug}
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
              >
                {isLoadingMore ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Loading more grants...
                  </div>
                ) : (
                  "View More →"
                )}
              </Button>
            </div>
          )}

          {/* Top RFPs - Mobile Only */}
            <TopRFPsCard
              topRFPs={topRFPs}
              topRFPsLoading={topRFPsLoading}
              topRFPsError={topRFPsError}
              className='mt-6 lg:hidden'
            />
        </>
      )}

      {/* Loading More State */}
      {loading && grants.length > 0 && (
        <div className='mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={`loading-${i}`}
              className="h-[466px] rounded-2xl"
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Memoize the component for performance
export const GrantsContentSection = React.memo(GrantsContentSectionComponent)
