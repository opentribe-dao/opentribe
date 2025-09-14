"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BountiesHeroSection } from "./components/hero-section";
import { BountiesContentSection } from "./components/content-section";
import { BountiesSidebar } from "./components/sidebar";
import { useBountiesFilters } from "@/hooks/use-bounties-filters";
import { useBountiesData, useBountiesSkills } from "@/hooks/use-bounties-data";
import { useBountiesSkillsFilter } from "@/hooks/use-bounties-skills-filter";
import { queryClientConfig } from "@/hooks/react-query";
import { useState } from "react";

// Status options for sidebar - extracted to improve readability and reusability
const statusOptions = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const queryClient = new QueryClient(queryClientConfig);

function BountiesPageContent() {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filtersHook = useBountiesFilters();
  const skillsFilter = useBountiesSkillsFilter();
  const bountiesData = useBountiesData(filtersHook.filters);
  const skillsQuery = useBountiesSkills();

  // Load more bounties (pagination)
  const handleLoadMore = () => {
    const nextPage = (filtersHook.filters.page || 1) + 1;
    filtersHook.updateFilter('page', nextPage);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <BountiesHeroSection
          searchQuery={filtersHook.filters.search || ''}
          totalCount={bountiesData.data?.total || 0}
          showMobileFilters={showMobileFilters}
          activeFiltersCount={filtersHook.activeFiltersCount}
          onSearchChange={(value) => filtersHook.updateFilter('search', value)}
          onSearchSubmit={(e) => {
            e.preventDefault();
            // Search is handled by the filter update
          }}
          onToggleMobileFilters={() => setShowMobileFilters(!showMobileFilters)}
        />

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-4'>
          <div className="lg:col-span-3">
            <BountiesContentSection
              bounties={bountiesData.data?.bounties || []}
              loading={bountiesData.isLoading}
              error={bountiesData.error}
              selectedSkills={skillsFilter.selectedSkills}
              skillsOptions={(skillsQuery.data || []).map((s) => s.skill)}
              filters={{
                status: filtersHook.filters.status || [],
                skills: filtersHook.filters.skills || [],
                sortBy: filtersHook.filters.sortBy || 'newest',
                priceRange: filtersHook.filters.priceRange || [0, 50000],
                hasSubmissions: filtersHook.filters.hasSubmissions || false,
                hasDeadline: filtersHook.filters.hasDeadline || false,
              }}
              hasMore={bountiesData.data?.hasMore || false}
              activeFiltersCount={filtersHook.activeFiltersCount}
              onSkillToggle={skillsFilter.toggleSkill}
              onClearAllSkills={skillsFilter.clearSkills}
              onClearAllFilters={filtersHook.clearAllFilters}
              onLoadMore={handleLoadMore}
              onRetry={() => bountiesData.refetch()}
            />
          </div>

          <BountiesSidebar
            filters={{
              status: filtersHook.filters.status || [],
              skills: filtersHook.filters.skills || [],
              sortBy: filtersHook.filters.sortBy || 'newest',
              priceRange: filtersHook.filters.priceRange || [0, 50000],
              hasSubmissions: filtersHook.filters.hasSubmissions || false,
              hasDeadline: filtersHook.filters.hasDeadline || false,
            }}
            statusOptions={statusOptions}
            activeFiltersCount={filtersHook.activeFiltersCount}
            showMobileFilters={showMobileFilters}
            onFilterChange={filtersHook.updateFilter}
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