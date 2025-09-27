'use client'

import React from 'react'
import { Button } from "@packages/base/components/ui/button"
import { Checkbox } from "@packages/base/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@packages/base/components/ui/radio-group"
import { Slider } from "@packages/base/components/ui/slider"

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
  onFilterChange: (key: keyof BountyFilters | 'showMobileFilters', value: any) => void
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
      
      <div className={`space-y-6 ${showMobileFilters ? 'fixed top-0 right-0 z-50 h-full w-90 translate-x-0 transform-gpu overflow-y-auto bg-[#111111] p-6 opacity-100 transition-opacity transition-transform duration-300 ease-out lg:relative lg:top-auto lg:right-auto lg:z-auto lg:h-auto lg:w-auto lg:bg-transparent lg:p-0' : 'pointer-events-none fixed top-0 right-0 z-40 h-full w-90 translate-x-full transform-gpu overflow-y-auto bg-[#111111] p-6 opacity-0 transition-opacity transition-transform duration-300 ease-out lg:pointer-events-auto lg:relative lg:top-auto lg:right-auto lg:z-auto lg:h-auto lg:w-auto lg:translate-x-0 lg:bg-transparent lg:p-0 lg:opacity-100'}`}>
      {/* Filters */}
      <div className='rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm'>
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
          <div className='flex items-center justify-between align-center'>
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
            onValueChange={(value) => onFilterChange("sortBy", value)}
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
                onFilterChange("priceRange", value as [number, number])
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
          <div className='flex justify-between gap-1 space-y-2 align-center'>
            <label htmlFor="has-submissions" className='flex cursor-pointer items-center gap-2'>
              <Checkbox
                id="has-submissions"
                checked={filters.hasSubmissions}
                onCheckedChange={(checked) =>
                  onFilterChange("hasSubmissions", !!checked)
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
                  onFilterChange("hasDeadline", !!checked)
                }
                className='border-white/40 data-[state=checked]:border-pink-500 data-[state=checked]:bg-pink-500'
              />
              <span className="text-sm text-white/70">Has Deadline</span>
            </label>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className='rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
        <h3 className='mb-4 font-heading font-semibold text-lg'>How it works</h3>
        <div className="space-y-4">
          {[
            {
              step: "1",
              title: "Browse and select",
              description: "Find a bounty that matches your skills"
            },
            {
              step: "2",
              title: "Participate / Develop / Submit",
              description: "Work on the bounty and submit your solution"
            },
            {
              step: "3",
              title: "Get paid for your work",
              description: "Receive rewards when your submission is accepted"
            }
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <div className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600'>
                <span className='font-bold text-sm'>{item.step}</span>
              </div>
              <div>
                <h4 className='mb-1 font-medium text-sm'>{item.title}</h4>
                <p className='text-white/60 text-xs'>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </>
  )
}

// Memoize the component for performance
export const BountiesSidebar = React.memo(BountiesSidebarComponent)
