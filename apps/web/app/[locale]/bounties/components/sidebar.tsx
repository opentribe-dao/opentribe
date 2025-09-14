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
  statusOptions: Array<{ value: string; label: string }>
  activeFiltersCount: number
  showMobileFilters: boolean
  onFilterChange: (key: keyof BountyFilters, value: any) => void
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
  statusOptions,
  activeFiltersCount,
  showMobileFilters,
  onFilterChange,
  onStatusToggle,
  onClearAllFilters
}: BountiesSidebarProps) {
  return (
    <div className={`space-y-6 ${showMobileFilters ? "block" : "hidden lg:block"}`}>
      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold font-heading">Filters</h3>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAllFilters}
              className="text-white/60 hover:text-white text-sm"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Status */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 text-white/80">Status</h4>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={filters.status.includes(option.value)}
                  onCheckedChange={() => onStatusToggle(option.value)}
                  className="border-white/40 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                />
                <span className="text-sm text-white/70">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 text-white/80">Sort By</h4>
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
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white/70 cursor-pointer"
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
          <h4 className="text-sm font-medium mb-3 text-white/80">
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
          <h4 className="text-sm font-medium mb-3 text-white/80">Additional</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.hasSubmissions}
                onCheckedChange={(checked) =>
                  onFilterChange("hasSubmissions", !!checked)
                }
                className="border-white/40 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
              />
              <span className="text-sm text-white/70">Has Submissions</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.hasDeadline}
                onCheckedChange={(checked) =>
                  onFilterChange("hasDeadline", !!checked)
                }
                className="border-white/40 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
              />
              <span className="text-sm text-white/70">Has Deadline</span>
            </label>
          </div>
        </div>
      </div>

      {/* Quick Stats removed: stats API deprecated */}
    </div>
  )
}

// Memoize the component for performance
export const BountiesSidebar = React.memo(BountiesSidebarComponent)
