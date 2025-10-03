'use client'

import React from 'react'
import { Button } from "@packages/base/components/ui/button"
import { Checkbox } from "@packages/base/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@packages/base/components/ui/radio-group"
import { Slider } from "@packages/base/components/ui/slider"
import { X } from "lucide-react"
import { HowItWorksCard } from "./how-it-works"

interface BountyFilters {
  status: string[]
  skills: string[]
  sortBy: string
  priceRange: [number, number]
  hasSubmissions: boolean
  hasDeadline: boolean
}

interface BountiesSidebarProps {
  filters: BountyFilters
  activeFiltersCount: number
  showMobileFilters: boolean
  onFilterChange: {
    onSortChange: (value: string) => void
    onStatusChange: (value: string) => void
    onSkillsChange: (value: string[]) => void
    onPriceRangeChange: (value: [number, number]) => void
    onHasSubmissionsChange: (value: boolean) => void
    onHasDeadlineChange: (value: boolean) => void
    onMobileFiltersToggle: (show: boolean) => void
  }
  onStatusToggle: (status: string) => void
  onClearAllFilters: () => void
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "amount_high", label: "Highest Amount" },
  { value: "amount_low", label: "Lowest Amount" },
  { value: "submissions", label: "Most Submissions" },
  { value: "deadline", label: "Deadline Soon" },
  { value: "views", label: "Most Views" },
]

function BountiesSidebarComponent({
  filters,
  activeFiltersCount,
  showMobileFilters,
  onFilterChange,
  onStatusToggle,
  onClearAllFilters
}: BountiesSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {showMobileFilters && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => onFilterChange.onMobileFiltersToggle(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onFilterChange.onMobileFiltersToggle(false);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close mobile filters"
        />
      )}
      
      {/* Sidebar Content */}
      <div className={`space-y-6 ${showMobileFilters ? 'fixed top-0 right-0 z-50 h-full w-80 overflow-y-auto bg-[#111111] p-6 lg:relative lg:top-auto lg:right-auto lg:z-auto lg:h-auto lg:w-auto lg:bg-transparent lg:p-0' : "hidden lg:block"}`}>
        {/* Mobile Close Button */}
        {showMobileFilters && (
          <div className='mb-4 flex justify-end lg:hidden'>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onFilterChange.onMobileFiltersToggle(false)}
              className='h-8 w-8 text-white/60 hover:bg-white/10 hover:text-white'
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
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
            {["Open", "In Review", "Completed"].map((status) => (
              <label
                key={status}
                htmlFor={`status-${status.toLowerCase().replace(' ', '-')}`}
                className='flex cursor-pointer items-center gap-2'
              >
                <Checkbox
                  id={`status-${status.toLowerCase().replace(' ', '-')}`}
                  checked={filters.status.includes(status.toLowerCase())}
                  onCheckedChange={() => onStatusToggle(status.toLowerCase())}
                  className='border-white/40 data-[state=checked]:border-pink-500 data-[state=checked]:bg-pink-500'
                />
                <span className="text-sm text-white/70">{status}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div className="mb-6">
          <h4 className='mb-3 font-medium text-sm text-white/80'>Sort By</h4>
          <RadioGroup
            value={filters.sortBy}
            onValueChange={(value) => onFilterChange.onSortChange(value)}
          >
            <div className="space-y-2">
              {SORT_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <label
                    htmlFor={option.value}
                    className='cursor-pointer font-medium text-sm text-white/70 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <h4 className='mb-3 font-medium text-sm text-white/80'>
            Bounty Amount Range
          </h4>
          <div className="space-y-4">
            <Slider
              value={filters.priceRange}
              onValueChange={(value) =>
                onFilterChange.onPriceRangeChange(value as [number, number])
              }
              max={50000}
              step={500}
              className="[&_[role=slider]]:bg-pink-500"
            />
            <div className="flex justify-between text-sm text-white/60">
              <span>${filters.priceRange[0].toLocaleString()}</span>
              <span>${filters.priceRange[1].toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Additional Filters */}
        <div>
          <h4 className='mb-3 font-medium text-sm text-white/80'>Additional</h4>
          <div className="space-y-2">
            <label htmlFor="has-submissions" className='flex cursor-pointer items-center gap-2'>
              <Checkbox
                id="has-submissions"
                checked={filters.hasSubmissions}
                onCheckedChange={(checked) =>
                  onFilterChange.onHasSubmissionsChange(!!checked)
                }
                className='border-white/40 data-[state=checked]:border-pink-500 data-[state=checked]:bg-pink-500'
              />
              <span className="text-sm text-white/70">Has Submissions</span>
            </label>
            <label htmlFor="has-deadline" className='flex cursor-pointer items-center gap-2'>
              <Checkbox
                id="has-deadline"
                checked={filters.hasDeadline}
                onCheckedChange={(checked) =>
                  onFilterChange.onHasDeadlineChange(!!checked)
                }
                className='border-white/40 data-[state=checked]:border-pink-500 data-[state=checked]:bg-pink-500'
              />
              <span className="text-sm text-white/70">Has Deadline</span>
            </label>
          </div>
        </div>
      </div>

      {/* How it works - Desktop Only */}
      <div className="hidden lg:block">
        <HowItWorksCard />
      </div>
      </div>
    </>
  )
}

// Memoize the component for performance
export const BountiesSidebar = React.memo(BountiesSidebarComponent)
