"use client";
import { useState } from "react";
import {
  useGrantsData,
  useGrantsSkills,
  useTopRFPs,
} from "@/hooks/use-grants-data";
import { useGrantsFilters } from "@/hooks/use-grants-filters";
import { GrantsContentSection } from "./components/content-section";
import { GrantsHeroSection } from "./components/hero-section";
import { GrantsSidebar } from "./components/sidebar";

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
          activeFiltersCount={filtersHook.activeFiltersCount}
          onSearchChange={(value) => filtersHook.updateFilter("search", value)}
          onSearchSubmit={(query) => filtersHook.updateFilter("search", query)}
          onToggleMobileFilters={() => setShowMobileFilters(!showMobileFilters)}
          searchQuery={filtersHook.filters.search || ""}
          showMobileFilters={showMobileFilters}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <GrantsContentSection
            activeFiltersCount={filtersHook.activeFiltersCount}
            error={grantsData.error}
            filters={{
              status: filtersHook.filters.status || ["open"],
              sortBy: filtersHook.filters.sortBy || "newest",
              priceRange: filtersHook.filters.priceRange || [0, 100_000],
            }}
            grants={grantsData.grants}
            hasMore={grantsData.hasMore}
            isLoadingMore={grantsData.isLoadingMore}
            loading={grantsData.isLoading}
            onClearAllFilters={filtersHook.clearAllFilters}
            onLoadMore={grantsData.loadMore}
            onRetry={() => grantsData.refetch()}
            onSkillToggle={filtersHook.toggleSkill}
            selectedSkills={filtersHook.filters.skills || []}
            skillsOptions={(skillsQuery.data || []).map((s) => s.skill)}
            topRFPs={topRFPsQuery.data || []}
            topRFPsError={topRFPsQuery.error}
            topRFPsLoading={topRFPsQuery.isLoading}
          />

          <GrantsSidebar
            activeFiltersCount={filtersHook.activeFiltersCount}
            filters={{
              status: filtersHook.filters.status || ["open"],
              sortBy: filtersHook.filters.sortBy || "newest",
              priceRange: filtersHook.filters.priceRange || [0, 100_000],
            }}
            onClearAllFilters={filtersHook.clearAllFilters}
            onFilterChange={{
              onSortChange: (value) =>
                filtersHook.updateFilter("sortBy", value),
              onStatusChange: (value) =>
                filtersHook.updateFilter("status", value),
              onPriceRangeChange: (value) =>
                filtersHook.updateFilter("priceRange", value),
              onMobileFiltersToggle: (show) => setShowMobileFilters(show),
            }}
            onStatusToggle={filtersHook.toggleStatus}
            showMobileFilters={showMobileFilters}
            topRFPs={topRFPsQuery.data || []}
            topRFPsError={topRFPsQuery.error}
            topRFPsLoading={topRFPsQuery.isLoading}
          />
        </div>
      </div>
    </div>
  );
}
