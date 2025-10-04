'use client'

import React from 'react'
import { Button } from "@packages/base/components/ui/button"
import { Input } from "@packages/base/components/ui/input"
import { Search, Filter, X } from "lucide-react"
import { StatsCard } from "@packages/base/components/ui/stats-card"


interface BountiesHeroSectionProps {
  searchQuery: string
  totalCount: number
  totalValue: number
  isLoading: boolean
  showMobileFilters: boolean
  activeFiltersCount: number
  onSearchChange: (value: string) => void
  onSearchSubmit: (query: string) => void
  onToggleMobileFilters: () => void
}

function BountiesHeroSectionComponent({
  searchQuery,
  totalCount,
  totalValue,
  isLoading,
  showMobileFilters: _showMobileFilters,
  activeFiltersCount,
  onSearchChange,
  onSearchSubmit,
  onToggleMobileFilters
}: BountiesHeroSectionProps) {
  return (
    <div className="mb-8">
      <h1 className='mb-2 font-bold font-heading text-4xl'>Bounties</h1>
      <p className="text-white/60">
        Complete tasks and earn rewards in the Polkadot ecosystem
      </p>

      {/* Search and Stats */}
      <div className='mt-6 grid grid-cols-1 gap-8 lg:grid-cols-4'>
        <div className='row-start-2 flex max-w-xl items-center gap-2 lg:col-span-3 lg:row-start-auto'>{/* Search form → push to 2nd row on mobile */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit(searchQuery);
          }}
          className='flex max-w-xl flex-1 gap-2'
        >
          <div className="relative flex-1">
            <Search className='-translate-y-1/2 absolute top-1/2 left-3 z-10 h-4 w-4 transform text-white/70' />
            <Input
              placeholder="Search bounties by title, organization, or skills..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className='border-white/10 bg-white/5 pr-10 pl-10 text-white placeholder:text-white/40'
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className='-translate-y-1/2 absolute top-1/2 right-3 rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white'
                aria-label="Clear search"
              >
                <X className='h-4 w-4' />
              </button>
            )}
          </div>
          <Button type="submit" className="bg-pink-500 hover:bg-pink-600">
            Search
          </Button>
        </form>
            {/* Mobile filter toggle moved here to appear first in mobile view */}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleMobileFilters}
            className='h-9 border-white/20 text-white hover:bg-white/10 lg:hidden'
          >
            <Filter className="h-4 w-4" />
            
            {activeFiltersCount > 0 && (
              <span className=' rounded-full bg-pink-500 px-1.5 py-0.5 text-white text-xs'>
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
        <StatsCard type="bounties" totalValue={totalValue} totalCount={totalCount} isLoading={isLoading} />
      </div>
    </div>
  )
}

// Memoize the component for performance
export const BountiesHeroSection = React.memo(BountiesHeroSectionComponent)
