"use client";

import { Button } from "@packages/base/components/ui/button";
import { Input } from "@packages/base/components/ui/input";
import { Filter, Search, X } from "lucide-react";
import React from "react";
import { GrantsStats } from "./stats";

interface GrantsHeroSectionProps {
  searchQuery: string;
  showMobileFilters: boolean;
  activeFiltersCount: number;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (query: string) => void;
  onToggleMobileFilters: () => void;
}

function GrantsHeroSectionComponent({
  searchQuery,
  activeFiltersCount,
  onSearchChange,
  onSearchSubmit,
  onToggleMobileFilters,
}: GrantsHeroSectionProps) {
  return (
    <div className="mb-4">
      <h1 className="mb-2 font-bold font-heading text-4xl">Grants</h1>
      <p className="text-white/60">
        Grants help grow grant programs in the Polkadot ecosystem
      </p>

      {/* Search and Stats */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="row-start-2 flex max-w-xl items-center gap-2 lg:col-span-3 lg:row-start-auto">
          {/* Search form → push to 2nd row on mobile */}
          <form
            className="flex max-w-xl flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit(searchQuery);
            }}
          >
            <div className="relative flex-1">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 z-10 h-4 w-4 transform text-white/70" />
              <Input
                aria-label="Search grants"
                className="border-white/10 bg-white/5 pr-10 pl-10 text-white placeholder:text-white/40"
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search grants by title, organization, or skills..."
                value={searchQuery}
              />
              {searchQuery && (
                <button
                  aria-label="Clear search"
                  className="-translate-y-1/2 absolute top-1/2 right-3 rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  onClick={() => onSearchChange("")}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              aria-label="Search grants"
              className="bg-pink-500 hover:bg-pink-600"
              type="submit"
            >
              Search
            </Button>
          </form>
          {/* Mobile filter toggle moved here to appear first in mobile view */}
          <Button
            className="h-9 border-white/20 text-white hover:bg-white/10 lg:hidden"
            onClick={onToggleMobileFilters}
            size="sm"
            variant="outline"
          >
            <Filter className="h-4 w-4" />

            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-pink-500 px-1.5 py-0.5 text-white text-xs">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
        <GrantsStats />
      </div>
    </div>
  );
}

// Memoize the component for performance
export const GrantsHeroSection = React.memo(GrantsHeroSectionComponent);
