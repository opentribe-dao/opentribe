"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GrantsHeroSection } from "./components/hero-section";
import { GrantsContentSection } from "./components/content-section";
import { GrantsSidebar } from "./components/sidebar";
import { useGrantsFilters } from "@/hooks/use-grants-filters";
import { useGrantsData, useGrantsSkills, useTopRFPs } from "@/hooks/use-grants-data";
import { queryClientConfig } from "@/hooks/react-query";
import { useState } from "react";

const queryClient = new QueryClient(queryClientConfig);

function GrantsPageContent() {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filtersHook = useGrantsFilters();
  const grantsData = useGrantsData(filtersHook.filters);
  const skillsQuery = useGrantsSkills();
  const topRFPsQuery = useTopRFPs();

  // Load more grants (pagination)
  const handleLoadMore = () => {
    const nextPage = (filtersHook.filters.page || 1) + 1;
    filtersHook.updateFilter('page', nextPage);
  };

  // Calculate if there are more grants to load
  const hasMore = grantsData.data ? grantsData.data.pagination.hasMore : false;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <GrantsHeroSection
          searchQuery={filtersHook.filters.search || ''}
          totalCount={grantsData.data?.grants?.length || 0}
          showMobileFilters={showMobileFilters}
          activeFiltersCount={filtersHook.activeFiltersCount}
          onSearchChange={(value) => filtersHook.updateFilter('search', value)}
          onSearchSubmit={(query) => filtersHook.updateFilter('search', query)}
          onToggleMobileFilters={() => setShowMobileFilters(!showMobileFilters)}
        />

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-4'>
          <GrantsContentSection
            grants={grantsData.data?.grants || []}
            loading={grantsData.isLoading}
            error={grantsData.error}
            selectedSkills={filtersHook.filters.skills || []}
            skillsOptions={(skillsQuery.data || []).map((s) => s.skill)}
            filters={{
              status: filtersHook.filters.status || 'OPEN',
              source: filtersHook.filters.source || 'ALL',
              sortBy: 'newest', // UI-only for now
              priceRange: [0, 100000], // UI-only for now
            }}
            hasMore={hasMore}
            activeFiltersCount={filtersHook.activeFiltersCount}
            onSkillToggle={filtersHook.toggleSkill}
            onClearAllFilters={filtersHook.clearAllFilters}
            onLoadMore={handleLoadMore}
            onRetry={() => grantsData.refetch()}
          />

          <GrantsSidebar
            filters={{
              status: filtersHook.filters.status || 'OPEN',
              source: filtersHook.filters.source || 'ALL',
              sortBy: 'newest', // UI-only for now
              priceRange: [0, 100000], // UI-only for now
            }}
            activeFiltersCount={filtersHook.activeFiltersCount}
            showMobileFilters={showMobileFilters}
            topRFPs={topRFPsQuery.data || []}
            topRFPsLoading={topRFPsQuery.isLoading}
            topRFPsError={topRFPsQuery.error}
            onFilterChange={(key, value) => {
              if (key === 'showMobileFilters') {
                setShowMobileFilters(value as boolean);
              } else {
                filtersHook.updateFilter(key as keyof typeof filtersHook.filters, value);
              }
            }}
            onStatusToggle={filtersHook.toggleStatus}
            onSourceToggle={filtersHook.toggleSource}
            onClearAllFilters={filtersHook.clearAllFilters}
          />
        </div>
      </div>
    </div>
  );
}

export default function GrantsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <GrantsPageContent />
    </QueryClientProvider>
  );
}