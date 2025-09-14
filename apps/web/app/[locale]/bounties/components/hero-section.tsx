'use client'

import React from 'react'
import { Button } from "@packages/base/components/ui/button"
import { Input } from "@packages/base/components/ui/input"
import { Search, Filter, X } from "lucide-react"

interface BountiesHeroSectionProps {
  searchQuery: string
  totalCount: number
  showMobileFilters: boolean
  activeFiltersCount: number
  onSearchChange: (value: string) => void
  onSearchSubmit: (e: React.FormEvent) => void
  onToggleMobileFilters: () => void
}

function BountiesHeroSectionComponent({
  searchQuery,
  totalCount,
  showMobileFilters,
  activeFiltersCount,
  onSearchChange,
  onSearchSubmit,
  onToggleMobileFilters
}: BountiesHeroSectionProps) {
  return (
    <div className="mb-4">
      <h1 className="text-4xl font-bold font-heading mb-2">Bounties</h1>
      <p className="text-white/60">
        Complete tasks and earn rewards in the Polkadot ecosystem
      </p>

      {/* Search and Stats */}
      <div className="mt-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <form
          onSubmit={onSearchSubmit}
          className="flex gap-2 flex-1 max-w-xl"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
            <Input
              placeholder="Search bounties by title, organization, or skills..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" className="bg-pink-500 hover:bg-pink-600">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-white/60">Total bounties: </span>
            <span className="font-semibold text-white">{totalCount}</span>
          </div>

          <Button
            variant="outline"
            onClick={onToggleMobileFilters}
            className="lg:hidden border-white/20 text-white hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Memoize the component for performance
export const BountiesHeroSection = React.memo(BountiesHeroSectionComponent)
