'use client'

import React from 'react'
import { Button } from "@packages/base/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@packages/base/components/ui/radio-group"
import { X } from "lucide-react"
import Link from "next/link"

interface RfpsFilters {
  search: string
  sort: string
  grant: string
  submission: string
}

interface TopBounty {
  id: string;
  title: string;
  voteCount: number;
  organization: {
    name: string;
  };
}

interface RfpsSidebarProps {
  filters: RfpsFilters
  activeFiltersCount: number
  showMobileFilters: boolean
  topBounties: TopBounty[]
  topBountiesLoading: boolean
  topBountiesError: Error | null
  onFilterChange: {
    onSortChange: (value: string) => void
    onGrantChange: (value: string) => void
    onSubmissionChange: (value: string) => void
    onMobileFiltersToggle: (show: boolean) => void
  }
  onClearAllFilters: () => void
}

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "recent", label: "Most Recent" },
  { value: "most_applications", label: "Most Applications" },
  { value: "least_applications", label: "Least Applications" },
]

const GRANT_OPTIONS = [
  { value: "all", label: "All Grants" },
  { value: "official", label: "Official Only" },
]

const SUBMISSION_OPTIONS = [
  { value: "highest", label: "Highest" },
  { value: "lowest", label: "Lowest" },
]

function RfpsSidebarComponent({
  filters,
  activeFiltersCount,
  showMobileFilters,
  topBounties,
  topBountiesLoading,
  topBountiesError,
  onFilterChange: {
    onSortChange,
    onGrantChange,
    onSubmissionChange,
    onMobileFiltersToggle
  },
  onClearAllFilters
}: RfpsSidebarProps) {
  const getGradientClass = (index: number) => {
    switch (index) {
      case 0: return 'from-pink-500 to-purple-600';
      case 1: return 'from-blue-500 to-cyan-600';
      case 2: return 'from-green-500 to-emerald-600';
      case 3: return 'from-orange-500 to-red-600';
      default: return 'from-purple-500 to-pink-600';
    }
  };
  return (
    <>
      {/* Mobile Overlay */}
      {showMobileFilters && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => onMobileFiltersToggle(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onMobileFiltersToggle(false);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close mobile filters"
        />
      )}
      
      {/* Sidebar Content */}
      <div className={`space-y-6 ${showMobileFilters ? 'fixed top-0 right-0 z-50 h-full w-80 overflow-y-auto bg-[#111111] p-6 lg:relative lg:top-auto lg:right-auto lg:z-auto lg:h-auto lg:w-auto lg:bg-transparent lg:p-0' : "hidden lg:block"}`}>
        {/* Filters */}
        <div className='rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
          <div className='mb-4 flex items-center justify-between'>
            <h3 className='font-heading font-semibold text-lg'>Sort By</h3>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAllFilters}
                className='text-sm text-white/60 hover:text-white'
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Sort By */}
          <div className="mb-6">
            <h4 className='mb-3 font-medium text-sm text-white/80'>Sort By</h4>
            <RadioGroup value={filters.sort} onValueChange={onSortChange}>
              <div className="space-y-2">
                {SORT_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`sort-${option.value}`}
                    className='flex cursor-pointer items-center gap-2'
                  >
                    <RadioGroupItem 
                      id={`sort-${option.value}`}
                      value={option.value} 
                      className="border-white/40 text-pink-500" 
                    />
                    <span className="text-sm text-white/70">{option.label}</span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Grant */}
          <div className="mb-6">
            <h4 className='mb-3 font-medium text-sm text-white/80'>Grant</h4>
            <RadioGroup value={filters.grant} onValueChange={onGrantChange}>
              <div className="space-y-2">
                {GRANT_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`grant-${option.value}`}
                    className='flex cursor-pointer items-center gap-2'
                  >
                    <RadioGroupItem 
                      id={`grant-${option.value}`}
                      value={option.value} 
                      className="border-white/40 text-pink-500" 
                    />
                    <span className="text-sm text-white/70">{option.label}</span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Submission */}
          <div>
            <h4 className='mb-3 font-medium text-sm text-white/80'>Submission</h4>
            <RadioGroup value={filters.submission} onValueChange={onSubmissionChange}>
              <div className="space-y-2">
                {SUBMISSION_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`submission-${option.value}`}
                    className='flex cursor-pointer items-center gap-2'
                  >
                    <RadioGroupItem 
                      id={`submission-${option.value}`}
                      value={option.value} 
                      className="border-white/40 text-pink-500" 
                    />
                    <span className="text-sm text-white/70">{option.label}</span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Top Bounties */}
        <div className='rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
          <h3 className='mb-4 font-heading font-semibold text-lg'>Top Bounties</h3>
          
          {topBountiesLoading && (
            <div className="space-y-3" aria-label="Loading top bounties">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className='flex items-center gap-3 rounded-lg p-2' aria-hidden="true">
                  <div className='h-10 w-10 animate-pulse rounded-full bg-white/10' />
                  <div className="flex-1">
                    <div className='mb-1 h-4 w-3/4 animate-pulse rounded bg-white/10' />
                    <div className='h-3 w-1/2 animate-pulse rounded bg-white/10' />
                  </div>
                  <div className='h-4 w-8 animate-pulse rounded bg-white/10' />
                </div>
              ))}
            </div>
          )}

          {topBountiesError && (
            <div 
              className='rounded-lg border border-red-500/20 bg-red-500/10 p-4'
              role="alert"
              aria-live="polite"
            >
              <div className='font-medium text-red-400 text-sm'>Error loading bounties</div>
              <div className='mt-1 text-red-300 text-xs'>
                {topBountiesError.message || 'Failed to load top bounties'}
              </div>
            </div>
          )}

          {!topBountiesLoading && !topBountiesError && topBounties.length === 0 && (
            <div className='py-4 text-center'>
              <div className='text-sm text-white/40'>No bounties available</div>
            </div>
          )}

          {!topBountiesLoading && !topBountiesError && topBounties.length > 0 && (
            <div className="space-y-3">
              {topBounties.map((bounty, index) => (
                <Link 
                  key={bounty.id} 
                  href={`/bounties/${bounty.id}`}
                  className='flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5'
                  aria-label={`View bounty: ${bounty.title} by ${bounty.organization.name}`}
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getGradientClass(index)}`}>
                    <span className='font-bold font-heading text-sm text-white'>
                      {index + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className='line-clamp-1 font-medium text-sm text-white'>{bounty.title}</h4>
                    <p className='truncate text-white/50 text-xs'>{bounty.organization.name}</p>
                  </div>
                  <div className='flex items-center gap-1 text-white/60 text-xs'>
                    <span>{bounty.voteCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        {showMobileFilters && (
          <div className="lg:hidden">
            <Button
              variant="outline"
              onClick={() => onMobileFiltersToggle(false)}
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <X className="mr-2 h-4 w-4" />
              Close Filters
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

// Memoize the component for performance
export const RfpsSidebar = React.memo(RfpsSidebarComponent)
