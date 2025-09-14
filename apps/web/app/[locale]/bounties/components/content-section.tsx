'use client'

import React from 'react'
import { Button } from "@packages/base/components/ui/button"
import { BountyCard } from "../../components/cards/bounty-card"

interface BountyFilters {
  status: string[]
  sortBy: string
  priceRange: [number, number]
  hasSubmissions: boolean
  hasDeadline: boolean
}

interface BountiesContentSectionProps {
  bounties: any[]
  loading: boolean
  error: Error | null
  selectedSkills: string[]
  skillsOptions: string[]
  filters: BountyFilters
  hasMore: boolean
  activeFiltersCount: number
  onSkillToggle: (skill: string) => void
  onClearAllSkills: () => void
  onClearAllFilters: () => void
  onLoadMore: () => void
  onRetry: () => void
}

function BountiesContentSectionComponent({
  bounties,
  loading,
  error,
  selectedSkills,
  skillsOptions,
  filters,
  hasMore,
  activeFiltersCount,
  onSkillToggle,
  onClearAllSkills,
  onClearAllFilters,
  onLoadMore,
  onRetry
}: BountiesContentSectionProps) {
  return (
    <div className="lg:col-span-3">
      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-white/60">Active filters:</span>
          {selectedSkills.length > 0 && (
            <span className="px-2 py-1 bg-pink-500/20 text-pink-300 rounded-md text-sm">
              Skills: {selectedSkills.join(", ")}
            </span>
          )}
          {filters.status.length !== 1 || !filters.status.includes("OPEN") ? (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-md text-sm">
              Status: {filters.status.join(", ")}
            </span>
          ) : null}
          {(filters.priceRange[0] > 0 || filters.priceRange[1] < 50000) && (
            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-md text-sm">
              Amount: ${filters.priceRange[0].toLocaleString()}-$
              {filters.priceRange[1].toLocaleString()}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAllFilters}
            className="text-white/60 hover:text-white text-sm"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Skills Filter */}
      <div className="mb-4">
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
            {loading && skillsOptions.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-24 rounded-lg bg-white/10 animate-pulse flex-shrink-0"
                  />
                ))
              : skillsOptions.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => onSkillToggle(skill)}
                    className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
                      selectedSkills.includes(skill)
                        ? "bg-pink-500/20 border-pink-400 text-pink-300"
                        : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:border-pink-400/50"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
          </div>
          <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-[#111111] to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6">
          <div className="text-red-400 mb-2">Error loading bounties</div>
          <div className="text-red-300 text-sm mb-4">{error.message}</div>
          <Button
            onClick={onRetry}
            variant="outline"
            className="border-red-500/40 text-red-300 hover:bg-red-500/10"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div
              key={i}
              className="h-[400px] bg-white/5 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : bounties.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {bounties.map((bounty, index) => {
              // Add safety check and ensure all required props exist
              if (!bounty?.id) {
                console.warn(
                  `Bounty at index ${index} is missing required data:`,
                  bounty,
                );
                return null;
              }

              return (
                <BountyCard
                  key={bounty.id}
                  id={bounty.id}
                  title={bounty.title || "Untitled Bounty"}
                  organization={
                    bounty.organization?.name || "Unknown Organization"
                  }
                  amount={
                    bounty.amount ? parseFloat(bounty.amount) : undefined
                  }
                  amountUSD={
                    bounty.amountUSD
                      ? parseFloat(bounty.amountUSD)
                      : undefined
                  }
                  token={bounty.token || "DOT"}
                  deadline={bounty.deadline}
                  submissionCount={bounty.submissionCount || 0}
                  status={bounty.status || "UNKNOWN"}
                  description={
                    bounty.description || "No description available"
                  }
                  skills={bounty.skills || []}
                  createdAt={bounty.createdAt}
                  winnersAnnouncedAt={bounty.winnersAnnouncedAt}
                />
              );
            })}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <Button
                onClick={onLoadMore}
                disabled={loading}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                {loading ? "Loading..." : "View More →"}
              </Button>
            </div>
          )}
        </>
      ) : !loading ? (
        <div className="text-center py-12">
          <div className="text-white/60 mb-4">No bounties found</div>
          <div className="text-sm text-white/40 mb-4">
            Try adjusting your search terms or filters
          </div>
          <Button
            onClick={onClearAllFilters}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Clear Filters
          </Button>
        </div>
      ) : null}
    </div>
  )
}

// Memoize the component for performance
export const BountiesContentSection = React.memo(BountiesContentSectionComponent)
