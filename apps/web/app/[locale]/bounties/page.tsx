"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BountiesHeroSection } from "./components/hero-section";
import { BountiesContentSection } from "./components/content-section";
import { BountiesSidebar } from "./components/sidebar";
import { useBountiesFilters } from "@/hooks/use-bounties-filters";
import { useBountiesData, useBountiesSkills } from "@/hooks/use-bounties-data";
import { queryClientConfig } from "@/hooks/react-query";
import { useState } from "react";

const queryClient = new QueryClient(queryClientConfig);

function BountiesPageContent() {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filtersHook = useBountiesFilters();
  const bountiesData = useBountiesData(filtersHook.filters);
  const skillsQuery = useBountiesSkills();

  // Load more bounties (pagination)
  const handleLoadMore = () => {
    const nextPage = (filtersHook.filters.page || 1) + 1;
    filtersHook.updateFilter('page', nextPage);
  };

  // Calculate if there are more bounties to load
  const hasMore = bountiesData.data ? 
    (bountiesData.data.bounties.length < bountiesData.data.pagination.total) : false;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <BountiesHeroSection
          searchQuery={filtersHook.filters.search || ''}
          totalCount={bountiesData.data?.pagination?.total || 0}
          showMobileFilters={showMobileFilters}
          activeFiltersCount={filtersHook.activeFiltersCount}
          onSearchChange={(value) => filtersHook.updateFilter('search', value)}
          onSearchSubmit={(query) => filtersHook.updateFilter('search', query)}
          onToggleMobileFilters={() => setShowMobileFilters(!showMobileFilters)}
        />

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-4'>
          <div className="lg:col-span-3">
            <BountiesContentSection
              bounties={bountiesData.data?.bounties || []}
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
              hasMore={hasMore}
              activeFiltersCount={filtersHook.activeFiltersCount}
              onSkillToggle={filtersHook.toggleSkill}
              onClearAllFilters={filtersHook.clearAllFilters}
              onLoadMore={handleLoadMore}
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
            onFilterChange={(key, value) => {
              if (key === 'showMobileFilters') {
                setShowMobileFilters(value);
              } else {
                filtersHook.updateFilter(key as keyof typeof filtersHook.filters, value);
              }
            }}
            onStatusToggle={filtersHook.toggleStatus}
            onClearAllFilters={filtersHook.clearAllFilters}
          />
        </div>
      </div>
    </div>
  );
}

export default function BountiesPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <BountiesPageContent />
    </QueryClientProvider>
  );
}