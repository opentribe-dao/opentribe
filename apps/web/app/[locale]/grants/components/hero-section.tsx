'use client'

import React from 'react'
import { Button } from "@packages/base/components/ui/button"
import { Input } from "@packages/base/components/ui/input"
import { Separator } from "@packages/base/components/ui/separator"
import { Search, Filter, X } from "lucide-react"

interface GrantsHeroSectionProps {
  searchQuery: string
  totalCount: number
  showMobileFilters: boolean
  activeFiltersCount: number
  onSearchChange: (value: string) => void
  onSearchSubmit: (query: string) => void
  onToggleMobileFilters: () => void
}

function GrantsHeroSectionComponent({
  searchQuery,
  totalCount,
  activeFiltersCount,
  onSearchChange,
  onSearchSubmit,
  onToggleMobileFilters
}: GrantsHeroSectionProps) {
  return (
    <div className="mb-4">
      <h1 className='mb-2 font-bold font-heading text-4xl'>Grants</h1>
      <p className="text-white/60">
        Grants help grow grant programs in the Polkadot ecosystem
      </p>

      {/* Search and Stats */}
      <div className='mt-6 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center'>
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
              placeholder="Search grants by title, organization, or skills..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className='border-white/10 bg-white/5 pr-10 pl-10 text-white placeholder:text-white/40'
              aria-label="Search grants"
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
          <Button type="submit" className="bg-pink-500 hover:bg-pink-600" aria-label="Search grants">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-6">
          <div className="text-sm">
            <span className="text-white/60">Total grants: </span>
            <span className="font-semibold text-white">{totalCount}</span>
          </div>
          
          <Separator orientation="vertical" className="h-4 bg-white/20 lg:hidden" />
          
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
export const GrantsHeroSection = React.memo(GrantsHeroSectionComponent)
