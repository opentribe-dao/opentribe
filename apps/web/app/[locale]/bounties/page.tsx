"use client";
import { useState } from "react";
import { useBountiesData, useBountiesSkills } from "@/hooks/use-bounties-data";
import { useBountiesFilters } from "@/hooks/use-bounties-filters";
import { BountiesContentSection } from "./components/content-section";
import { BountiesHeroSection } from "./components/hero-section";
import { BountiesSidebar } from "./components/sidebar";

export default function BountiesPage() {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filtersHook = useBountiesFilters();
  const bountiesData = useBountiesData(filtersHook.filters);
  const skillsQuery = useBountiesSkills();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <BountiesHeroSection
          activeFiltersCount={filtersHook.activeFiltersCount}
          onSearchChange={(value) => filtersHook.updateFilter("search", value)}
          onSearchSubmit={(query) => filtersHook.updateFilter("search", query)}
          onToggleMobileFilters={() => setShowMobileFilters(!showMobileFilters)}
          searchQuery={filtersHook.filters.search || ""}
          showMobileFilters={showMobileFilters}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <BountiesContentSection
              activeFiltersCount={filtersHook.activeFiltersCount}
              bounties={bountiesData.bounties}
              error={bountiesData.error}
              filters={{
                status: filtersHook.filters.status || [],
                sortBy: filtersHook.filters.sortBy || "",
                priceRange: filtersHook.filters.priceRange || [0, 50_000],
                hasSubmissions: filtersHook.filters.hasSubmissions ?? false,
                hasDeadline: filtersHook.filters.hasDeadline ?? false,
              }}
              hasMore={bountiesData.hasMore}
              isLoadingMore={bountiesData.isLoadingMore}
              loading={bountiesData.isLoading}
              onClearAllFilters={filtersHook.clearAllFilters}
              onLoadMore={bountiesData.loadMore}
              onRetry={() => bountiesData.refetch()}
              onSkillToggle={filtersHook.toggleSkill}
              selectedSkills={filtersHook.filters.skills || []}
              skillsOptions={(skillsQuery.data || []).map((s) => s.skill)}
            />
          </div>

          <BountiesSidebar
            activeFiltersCount={filtersHook.activeFiltersCount}
            filters={{
              status: filtersHook.filters.status || [],
              skills: filtersHook.filters.skills || [],
              sortBy: filtersHook.filters.sortBy || "",
              priceRange: filtersHook.filters.priceRange || [0, 50_000],
              hasSubmissions: filtersHook.filters.hasSubmissions ?? false,
              hasDeadline: filtersHook.filters.hasDeadline ?? false,
            }}
            onClearAllFilters={filtersHook.clearAllFilters}
            onFilterChange={{
              onSortChange: (value) =>
                filtersHook.updateFilter("sortBy", value),
              onStatusChange: (value) =>
                filtersHook.updateFilter("status", value),
              onSkillsChange: (value) =>
                filtersHook.updateFilter("skills", value),
              onPriceRangeChange: (value) =>
                filtersHook.updateFilter("priceRange", value),
              onHasSubmissionsChange: (value) =>
                filtersHook.updateFilter("hasSubmissions", value),
              onHasDeadlineChange: (value) =>
                filtersHook.updateFilter("hasDeadline", value),
              onMobileFiltersToggle: (show) => setShowMobileFilters(show),
            }}
            onStatusToggle={filtersHook.toggleStatus}
            showMobileFilters={showMobileFilters}
          />
        </div>
      </div>
    </div>
  );
}
