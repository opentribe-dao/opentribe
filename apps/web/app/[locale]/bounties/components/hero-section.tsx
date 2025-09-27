'use client'

import React from 'react'
import { Button } from "@packages/base/components/ui/button"
import { Input } from "@packages/base/components/ui/input"
import { Search, Filter, X } from "lucide-react"
import { DollarSign, Briefcase } from "lucide-react";


interface BountiesHeroSectionProps {
  searchQuery: string
  totalCount: number
  showMobileFilters: boolean
  activeFiltersCount: number
  onSearchChange: (value: string) => void
  onSearchSubmit: (query: string) => void
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
    <div className="mb-8">
      <h1 className='mb-2 font-bold font-heading text-4xl'>Bounties</h1>
      <p className="text-white/60">
        Complete tasks and earn rewards in the Polkadot ecosystem
      </p>

      {/* Search and Stats */}
      <div className='mt-6 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-end'>
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

        <div className='items-center gap-4 sm:flex md:flex '>
          <div className='total-value-container flex gap-4 text-sm '>
            <div className='flex items-center gap-2 '>
              <div className='icon'>
                <DollarSign className='h-8 w-8 rounded-full bg-white/10 p-2' />
              </div>
              <div className='flex flex-col '>
                <span className="font-semibold text-white">{totalCount}</span>
                <span className="text-white/60">bounties: </span>
              </div>
            </div>

            <div className='flex items-center gap-2 border-white/10 border-l pl-4'>
              <div className='icon'>
              <Briefcase className='h-8 w-8 rounded-full bg-white/10 p-2' />
              </div>
              <div className='flex flex-col'>
                <span className='font-semibold text-white'>150 </span>
                <span className="text-white/60">Opportunities</span>
              </div>
            </div>

            <div>

            </div>

          </div>
          
          {/* Spacer/Divider */}
          {/* biome-ignore lint/style/useSelfClosingElements: <explanation> */}
          <div className="h-4 w-px bg-white/20 lg:hidden"></div>
          
          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleMobileFilters}
            className="border-white/20 text-white hover:bg-white/10 lg:hidden"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className='ml-2 rounded-full bg-pink-500 px-1.5 py-0.5 text-white text-xs'>
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
