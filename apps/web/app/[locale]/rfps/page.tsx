"use client";
import { useState } from "react";
import { useRfpsData, useTopBounties } from "@/hooks/use-rfps-data";
import { useRfpsFilters } from "@/hooks/use-rfps-filters";
import { RfpsContentSection } from "./components/content-section";
import { RfpsHeroSection } from "./components/hero-section";
import { RfpsSidebar } from "./components/sidebar";

export default function RFPsPage() {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filtersHook = useRfpsFilters();
  const rfpsData = useRfpsData(filtersHook.filters);
  const topBountiesQuery = useTopBounties();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <RfpsHeroSection
          activeFiltersCount={filtersHook.activeFiltersCount}
          onSearchChange={(value) => filtersHook.updateFilter("search", value)}
          onSearchSubmit={(query) => filtersHook.updateFilter("search", query)}
          onToggleMobileFilters={() => setShowMobileFilters(!showMobileFilters)}
          searchQuery={filtersHook.filters.search || ""}
          showMobileFilters={showMobileFilters}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <RfpsContentSection
            activeFiltersCount={filtersHook.activeFiltersCount}
            error={rfpsData.error}
            filters={{
              search: filtersHook.filters.search || "",
              status: filtersHook.filters.status || ["open"],
              sort: filtersHook.filters.sort || "popular",
              grant: filtersHook.filters.grant || "all",
              submission: filtersHook.filters.submission || "highest",
            }}
            hasMore={rfpsData.hasMore}
            isLoadingMore={rfpsData.isLoadingMore}
            loading={rfpsData.isLoading}
            onClearAllFilters={filtersHook.clearAllFilters}
            onLoadMore={rfpsData.loadMore}
            onRetry={() => rfpsData.refetch()}
            rfps={rfpsData.rfps}
            topBounties={topBountiesQuery.data || []}
            topBountiesError={topBountiesQuery.error}
            topBountiesLoading={topBountiesQuery.isLoading}
          />

          <RfpsSidebar
            activeFiltersCount={filtersHook.activeFiltersCount}
            filters={{
              search: filtersHook.filters.search || "",
              status: filtersHook.filters.status || ["open"],
              sort: filtersHook.filters.sort || "popular",
              grant: filtersHook.filters.grant || "all",
              submission: filtersHook.filters.submission || "highest",
            }}
            onClearAllFilters={filtersHook.clearAllFilters}
            onFilterChange={{
              onSortChange: (value) => filtersHook.updateFilter("sort", value),
              onGrantChange: (value) =>
                filtersHook.updateFilter("grant", value),
              onSubmissionChange: (value) =>
                filtersHook.updateFilter("submission", value),
              onMobileFiltersToggle: (show) => setShowMobileFilters(show),
            }}
            onStatusToggle={filtersHook.toggleStatus}
            showMobileFilters={showMobileFilters}
            topBounties={topBountiesQuery.data || []}
            topBountiesError={topBountiesQuery.error}
            topBountiesLoading={topBountiesQuery.isLoading}
          />
        </div>
      </div>
    </div>
  );
}
