"use client";
import { RfpsHeroSection } from "./components/hero-section";
import { RfpsContentSection } from "./components/content-section";
import { RfpsSidebar } from "./components/sidebar";
import { useRfpsFilters } from "@/hooks/use-rfps-filters";
import { useRfpsData, useTopBounties } from "@/hooks/use-rfps-data";
import { useState } from "react";

export default function RFPsPage() {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filtersHook = useRfpsFilters();
  const rfpsData = useRfpsData(filtersHook.filters);
  const topBountiesQuery = useTopBounties();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <RfpsHeroSection
          searchQuery={filtersHook.filters.search || ''}
          totalCount={rfpsData.rfps.length}
          totalValue={rfpsData.rfps.reduce((acc, rfp) => acc + (Number(rfp.grant.maxAmount) || 0), 0)}
          isLoading={rfpsData.isLoading}
          showMobileFilters={showMobileFilters}
          activeFiltersCount={filtersHook.activeFiltersCount}
          onSearchChange={(value) => filtersHook.updateFilter('search', value)}
          onSearchSubmit={(query) => filtersHook.updateFilter('search', query)}
          onToggleMobileFilters={() => setShowMobileFilters(!showMobileFilters)}
        />

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-4'>
          <RfpsContentSection
            rfps={rfpsData.rfps}
            loading={rfpsData.isLoading}
            error={rfpsData.error}
            filters={{
              search: filtersHook.filters.search || '',
              status: filtersHook.filters.status || ['open'],
              sort: filtersHook.filters.sort || 'popular',
              grant: filtersHook.filters.grant || 'all',
              submission: filtersHook.filters.submission || 'highest',
            }}
            hasMore={rfpsData.hasMore}
            isLoadingMore={rfpsData.isLoadingMore}
            activeFiltersCount={filtersHook.activeFiltersCount}
            onClearAllFilters={filtersHook.clearAllFilters}
            onLoadMore={rfpsData.loadMore}
            onRetry={() => rfpsData.refetch()}
            topBounties={topBountiesQuery.data || []}
            topBountiesLoading={topBountiesQuery.isLoading}
            topBountiesError={topBountiesQuery.error}
          />

          <RfpsSidebar
            filters={{
              search: filtersHook.filters.search || '',
              status: filtersHook.filters.status || ['open'],
              sort: filtersHook.filters.sort || 'popular',
              grant: filtersHook.filters.grant || 'all',
              submission: filtersHook.filters.submission || 'highest',
            }}
            activeFiltersCount={filtersHook.activeFiltersCount}
            showMobileFilters={showMobileFilters}
            topBounties={topBountiesQuery.data || []}
            topBountiesLoading={topBountiesQuery.isLoading}
            topBountiesError={topBountiesQuery.error}
            onFilterChange={{
              onSortChange: (value) => filtersHook.updateFilter('sort', value),
              onGrantChange: (value) => filtersHook.updateFilter('grant', value),
              onSubmissionChange: (value) => filtersHook.updateFilter('submission', value),
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