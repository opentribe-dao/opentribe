'use client'

import React from 'react'
import { Button } from "@packages/base/components/ui/button"
import { Checkbox } from "@packages/base/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@packages/base/components/ui/radio-group"
import { Slider } from "@packages/base/components/ui/slider"
import { ThumbsUp, X } from "lucide-react"

interface GrantFilters {
  status: string
  source: string[]
  sortBy: string
  priceRange: [number, number]
}

interface TopRfp {
  id: string;
  title: string;
  voteCount: number;
  grant: {
    organization: {
      name: string;
    };
  };
}

interface GrantsSidebarProps {
  filters: GrantFilters
  activeFiltersCount: number
  showMobileFilters: boolean
  topRFPs: TopRfp[]
  topRFPsLoading: boolean
  topRFPsError: Error | null
  onFilterChange: (key: keyof GrantFilters | 'showMobileFilters', value: unknown) => void
  onStatusToggle: (status: string) => void
  onSourceToggle: (source: string) => void
  onClearAllFilters: () => void
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "amount_high", label: "Highest Amount" },
  { value: "amount_low", label: "Lowest Amount" },
  { value: "applications", label: "Most Applications" },
  { value: "rfps", label: "Most RFPs" },
]

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "COMPLETED", label: "Completed" },
]

const SOURCE_OPTIONS = [
  { value: "ALL", label: "All Sources" },
  { value: "NATIVE", label: "Native" },
  { value: "EXTERNAL", label: "External" },
]

function GrantsSidebarComponent({
  filters,
  activeFiltersCount,
  showMobileFilters,
  topRFPs,
  topRFPsLoading,
  topRFPsError,
  onFilterChange,
  onStatusToggle,
  onSourceToggle,
  onClearAllFilters
}: GrantsSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {showMobileFilters && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => onFilterChange('showMobileFilters', false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onFilterChange('showMobileFilters', false);
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
            <h3 className='font-heading font-semibold text-lg'>Filters</h3>
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

          {/* Status */}
          <div className="mb-6">
            <h4 className='mb-3 font-medium text-sm text-white/80'>Status</h4>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((status) => (
                <label
                  key={status.value}
                  htmlFor={`status-${status.value.toLowerCase()}`}
                  className='flex cursor-pointer items-center gap-2'
                >
                  <Checkbox
                    id={`status-${status.value.toLowerCase()}`}
                    checked={filters.status === status.value}
                    onCheckedChange={() => onStatusToggle(status.value)}
                    className='border-white/40 data-[state=checked]:border-pink-500 data-[state=checked]:bg-pink-500'
                  />
                  <span className="text-sm text-white/70">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Source */}
          <div className="mb-6">
            <h4 className='mb-3 font-medium text-sm text-white/80'>Source</h4>
            <div className="space-y-2">
              {SOURCE_OPTIONS.map((source) => (
                <label
                  key={source.value}
                  htmlFor={`source-${source.value.toLowerCase()}`}
                  className='flex cursor-pointer items-center gap-2'
                >
                  <Checkbox
                    id={`source-${source.value.toLowerCase()}`}
                    checked={filters.source.includes(source.value)}
                    onCheckedChange={() => onSourceToggle(source.value)}
                    className='border-white/40 data-[state=checked]:border-pink-500 data-[state=checked]:bg-pink-500'
                  />
                  <span className="text-sm text-white/70">{source.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div className="mb-6">
            <h4 className='mb-3 font-medium text-sm text-white/80'>Sort By</h4>
            <RadioGroup value={filters.sortBy} onValueChange={(value) => onFilterChange('sortBy', value)}>
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

          {/* Price Range */}
          <div className="mb-6">
            <h4 className='mb-3 font-medium text-sm text-white/80'>Amount Range</h4>
            <div className="space-y-4">
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => onFilterChange('priceRange', value)}
                max={100000}
                step={1000}
                className="[&_[role=slider]]:bg-pink-500"
              />
              <div className="flex justify-between text-sm text-white/60">
                <span>${filters.priceRange[0].toLocaleString()}</span>
                <span>${filters.priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top RFPs */}
        <div className='rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
          <h3 className='mb-4 font-heading font-semibold text-lg'>Top RFP's</h3>
          
          {topRFPsLoading && (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className='flex items-center gap-3 rounded-lg p-2'>
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

          {topRFPsError && (
            <div className='rounded-lg border border-red-500/20 bg-red-500/10 p-4'>
              <div className='font-medium text-red-400 text-sm'>Error loading RFPs</div>
              <div className='mt-1 text-red-300 text-xs'>
                {topRFPsError.message || 'Failed to load top RFPs'}
              </div>
            </div>
          )}

          {!topRFPsLoading && !topRFPsError && topRFPs.length === 0 && (
            <div className='py-4 text-center'>
              <div className='text-sm text-white/40'>No RFPs available</div>
            </div>
          )}

          {!topRFPsLoading && !topRFPsError && topRFPs.length > 0 && (
            <div className="space-y-3">
              {topRFPs.map((rfp, index) => (
                <button 
                  key={rfp.id} 
                  className='flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5'
                  aria-label={`View RFP: ${rfp.title} by ${rfp.grant.organization.name}`}
                  onClick={() => {
                    // TODO: Navigate to RFP detail page when available
                  }}
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${
                    index === 0 ? 'from-yellow-500 to-orange-600' :
                    index === 1 ? 'from-gray-400 to-gray-600' :
                    index === 2 ? 'from-amber-600 to-yellow-700' :
                    'from-pink-500 to-purple-600'
                  }`}>
                    <span className='font-bold font-heading text-sm text-white'>
                      {index + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className='line-clamp-1 font-medium text-sm text-white'>{rfp.title}</h4>
                    <p className='truncate text-white/50 text-xs'>{rfp.grant.organization.name}</p>
                  </div>
                  <div className='flex items-center gap-1 text-white/60 text-xs'>
                    <ThumbsUp className='h-3 w-3' />
                    <span>{rfp.voteCount}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        {showMobileFilters && (
          <div className="lg:hidden">
            <Button
              variant="outline"
              onClick={() => onFilterChange('showMobileFilters', false)}
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
export const GrantsSidebar = React.memo(GrantsSidebarComponent)
