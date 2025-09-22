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

interface PopularGrant {
  id: string;
  name: string;
  organization: {
    name: string;
    logo?: string;
  };
}

interface RfpsSidebarProps {
  filters: RfpsFilters
  activeFiltersCount: number
  showMobileFilters: boolean
  popularGrants: PopularGrant[]
  popularGrantsLoading: boolean
  popularGrantsError: Error | null
  onFilterChange: (key: keyof RfpsFilters | 'showMobileFilters', value: unknown) => void
  onClearAllFilters: () => void
}

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "recent", label: "Most Recent" },
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
  popularGrants,
  popularGrantsLoading,
  popularGrantsError,
  onFilterChange,
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
            <h3 className='font-heading font-semibold text-lg'>Filter By</h3>
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

          {/* Popular */}
          <div className="mb-6">
            <h4 className='mb-3 font-medium text-sm text-white/80'>Popular</h4>
            <RadioGroup value={filters.sort} onValueChange={(value) => onFilterChange('sort', value)}>
              <div className="space-y-2">
                {SORT_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`sort-${option.value}`}
                    className='flex items-center gap-2 cursor-pointer'
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
            <RadioGroup value={filters.grant} onValueChange={(value) => onFilterChange('grant', value)}>
              <div className="space-y-2">
                {GRANT_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`grant-${option.value}`}
                    className='flex items-center gap-2 cursor-pointer'
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
            <RadioGroup value={filters.submission} onValueChange={(value) => onFilterChange('submission', value)}>
              <div className="space-y-2">
                {SUBMISSION_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`submission-${option.value}`}
                    className='flex items-center gap-2 cursor-pointer'
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

        {/* Popular Grants */}
        <div className='rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
          <h3 className='mb-4 font-heading font-semibold text-lg'>Popular Grants</h3>
          
          {popularGrantsLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className='flex items-center gap-3 rounded-lg p-2'>
                  <div className='h-10 w-10 animate-pulse rounded-full bg-white/10' />
                  <div className="flex-1">
                    <div className='h-4 w-3/4 animate-pulse rounded bg-white/10 mb-1' />
                    <div className='h-3 w-1/2 animate-pulse rounded bg-white/10' />
                  </div>
                </div>
              ))}
            </div>
          )}

          {popularGrantsError && (
            <div className='rounded-lg border border-red-500/20 bg-red-500/10 p-4'>
              <div className='text-red-400 text-sm font-medium'>Error loading grants</div>
              <div className='text-red-300 text-xs mt-1'>
                {popularGrantsError.message || 'Failed to load popular grants'}
              </div>
            </div>
          )}

          {!popularGrantsLoading && !popularGrantsError && popularGrants.length === 0 && (
            <div className='text-center py-4'>
              <div className='text-white/40 text-sm'>No grants available</div>
            </div>
          )}

          {!popularGrantsLoading && !popularGrantsError && popularGrants.length > 0 && (
            <div className="space-y-3">
              {popularGrants.map((grant, index) => (
                <Link 
                  key={grant.id} 
                  href={`/grants/${grant.id}`}
                  className='flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5 cursor-pointer'
                  aria-label={`View grant: ${grant.name} by ${grant.organization.name}`}
                >
                  <div className={`h-10 w-10 flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getGradientClass(index)}`}>
                    <span className='text-sm font-bold text-white font-heading'>
                      {grant.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className='text-sm font-medium text-white line-clamp-1'>{grant.name}</h4>
                    <p className='text-xs text-white/50 truncate'>{grant.organization.name}</p>
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
export const RfpsSidebar = React.memo(RfpsSidebarComponent)
