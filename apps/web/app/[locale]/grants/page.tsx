"use client";
import { GrantsHeroSection } from "./components/hero-section";
import { GrantsContentSection } from "./components/content-section";
import { GrantsSidebar } from "./components/sidebar";
import { useGrantsFilters } from "@/hooks/use-grants-filters";
import { useGrantsData, useGrantsSkills, useTopRFPs } from "@/hooks/use-grants-data";
import { useState } from "react";


export default function GrantsPage() {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filtersHook = useGrantsFilters();
  const grantsData = useGrantsData(filtersHook.filters);
  const skillsQuery = useGrantsSkills();
  const topRFPsQuery = useTopRFPs();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <GrantsHeroSection
          searchQuery={filtersHook.filters.search || ''}
          // TODO: @tarun fix this, ask @shivam about this
          totalCount={grantsData.grants.length}
          // TODO: @tarun fix this, ask @shivam about this
          totalValue={grantsData.grants.reduce((acc, grant) => acc + (Number(grant.maxAmount) || 0) + (Number(grant.minAmount) || 0), 0)}
          isLoading={grantsData.isLoading}
          showMobileFilters={showMobileFilters}
          activeFiltersCount={filtersHook.activeFiltersCount}
          onSearchChange={(value) => filtersHook.updateFilter('search', value)}
          onSearchSubmit={(query) => filtersHook.updateFilter('search', query)}
          onToggleMobileFilters={() => setShowMobileFilters(!showMobileFilters)}
        />

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-4'>
          <GrantsContentSection
            grants={grantsData.grants}
            loading={grantsData.isLoading}
            error={grantsData.error}
            selectedSkills={filtersHook.filters.skills || []}
            skillsOptions={(skillsQuery.data || []).map((s) => s.skill)}
            filters={{
              status: filtersHook.filters.status || ['open'],
              sortBy: filtersHook.filters.sortBy || 'newest',
              priceRange: filtersHook.filters.priceRange || [0, 100000],
            }}
            hasMore={grantsData.hasMore}
            isLoadingMore={grantsData.isLoadingMore}
            activeFiltersCount={filtersHook.activeFiltersCount}
            onSkillToggle={filtersHook.toggleSkill}
            onClearAllFilters={filtersHook.clearAllFilters}
            onLoadMore={grantsData.loadMore}
            onRetry={() => grantsData.refetch()}
            topRFPs={topRFPsQuery.data || []}
            topRFPsLoading={topRFPsQuery.isLoading}
            topRFPsError={topRFPsQuery.error}
          />

          <GrantsSidebar
            filters={{
              status: filtersHook.filters.status || ['open'],
              sortBy: filtersHook.filters.sortBy || 'newest',
              priceRange: filtersHook.filters.priceRange || [0, 100000],
            }}
            activeFiltersCount={filtersHook.activeFiltersCount}
            showMobileFilters={showMobileFilters}
            topRFPs={topRFPsQuery.data || []}
            topRFPsLoading={topRFPsQuery.isLoading}
            topRFPsError={topRFPsQuery.error}
            onFilterChange={{
              onSortChange: (value) => filtersHook.updateFilter('sortBy', value),
              onStatusChange: (value) => filtersHook.updateFilter('status', value),
              onPriceRangeChange: (value) => filtersHook.updateFilter('priceRange', value),
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