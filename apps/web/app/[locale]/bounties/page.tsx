"use client";
import { BountiesHeroSection } from "./components/hero-section";
import { BountiesContentSection } from "./components/content-section";
import { BountiesSidebar } from "./components/sidebar";
import { useBountiesFilters } from "@/hooks/use-bounties-filters";
import { useBountiesData, useBountiesSkills } from "@/hooks/use-bounties-data";
import { useState } from "react";

export default function BountiesPage() {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filtersHook = useBountiesFilters();
  const bountiesData = useBountiesData(filtersHook.filters);
  const skillsQuery = useBountiesSkills();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <BountiesHeroSection
          searchQuery={filtersHook.filters.search || ''}
          // TODO: @tarun fix this, ask @shivam about this
          totalCount={bountiesData.bounties.length}
          // TODO: @tarun fix this, ask @shivam about this
          totalValue={bountiesData.bounties.reduce((acc, bounty) => acc + (Number(bounty.amount) || 0), 0)}
          isLoading={bountiesData.isLoading}
          showMobileFilters={showMobileFilters}
          activeFiltersCount={filtersHook.activeFiltersCount}
          onSearchChange={(value) => filtersHook.updateFilter('search', value)}
          onSearchSubmit={(query) => filtersHook.updateFilter('search', query)}
          onToggleMobileFilters={() => setShowMobileFilters(!showMobileFilters)}
        />

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-4'>
          <div className="lg:col-span-3">
            <BountiesContentSection
              bounties={bountiesData.bounties}
              loading={bountiesData.isLoading}
              error={bountiesData.error}
              selectedSkills={filtersHook.filters.skills || []}
              skillsOptions={(skillsQuery.data || []).map((s) => s.skill)}
              filters={{
                status: filtersHook.filters.status || [],
                sortBy: filtersHook.filters.sortBy || '',
                priceRange: filtersHook.filters.priceRange || [0, 50000],
                hasSubmissions: filtersHook.filters.hasSubmissions || false,
                hasDeadline: filtersHook.filters.hasDeadline || false,
              }}
              hasMore={bountiesData.hasMore}
              isLoadingMore={bountiesData.isLoadingMore}
              activeFiltersCount={filtersHook.activeFiltersCount}
              onSkillToggle={filtersHook.toggleSkill}
              onClearAllFilters={filtersHook.clearAllFilters}
              onLoadMore={bountiesData.loadMore}
              onRetry={() => bountiesData.refetch()}
            />
          </div>

          <BountiesSidebar
            filters={{
              status: filtersHook.filters.status || [],
              skills: filtersHook.filters.skills || [],
              sortBy: filtersHook.filters.sortBy || '',
              priceRange: filtersHook.filters.priceRange || [0, 50000],
              hasSubmissions: filtersHook.filters.hasSubmissions || false,
              hasDeadline: filtersHook.filters.hasDeadline || false,
            }}
            activeFiltersCount={filtersHook.activeFiltersCount}
            showMobileFilters={showMobileFilters}
            onFilterChange={{
              onSortChange: (value) => filtersHook.updateFilter('sortBy', value),
              onStatusChange: (value) => filtersHook.updateFilter('status', value),
              onSkillsChange: (value) => filtersHook.updateFilter('skills', value),
              onPriceRangeChange: (value) => filtersHook.updateFilter('priceRange', value),
              onHasSubmissionsChange: (value) => filtersHook.updateFilter('hasSubmissions', value),
              onHasDeadlineChange: (value) => filtersHook.updateFilter('hasDeadline', value),
              onMobileFiltersToggle: (show) => setShowMobileFilters(show),
            }}
            onStatusToggle={filtersHook.toggleStatus}
            onClearAllFilters={filtersHook.clearAllFilters}
          />
        </div>
      </div>
    </div>
  );
}