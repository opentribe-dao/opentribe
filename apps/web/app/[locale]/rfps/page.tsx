"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RfpsHeroSection } from "./components/hero-section";
import { RfpsContentSection } from "./components/content-section";
import { RfpsSidebar } from "./components/sidebar";
import { useRfpsFilters } from "@/hooks/use-rfps-filters";
import { useRfpsData, useTopBounties } from "@/hooks/use-rfps-data";
import { queryClientConfig } from "@/hooks/react-query";
import { useState } from "react";

const queryClient = new QueryClient(queryClientConfig);

function RFPsPageContent() {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filtersHook = useRfpsFilters();
  const rfpsData = useRfpsData(filtersHook.filters);
  const topBountiesQuery = useTopBounties();

  // Load more RFPs (pagination)
  const handleLoadMore = () => {
    const nextPage = (filtersHook.filters.page || 1) + 1;
    filtersHook.updateFilter('page', nextPage);
  };

  // Calculate if there are more RFPs to load
  const hasMore = rfpsData.data ? rfpsData.data.pagination.hasMore : false;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <RfpsHeroSection
          searchQuery={filtersHook.filters.search || ''}
          totalCount={rfpsData.data?.rfps?.length || 0}
          showMobileFilters={showMobileFilters}
          activeFiltersCount={filtersHook.activeFiltersCount}
          onSearchChange={(value) => filtersHook.updateFilter('search', value)}
          onSearchSubmit={(query) => filtersHook.updateFilter('search', query)}
          onToggleMobileFilters={() => setShowMobileFilters(!showMobileFilters)}
        />

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-4'>
          <RfpsContentSection
            rfps={rfpsData.data?.rfps || []}
            loading={rfpsData.isLoading}
            error={rfpsData.error}
            filters={{
              search: filtersHook.filters.search || '',
              sort: filtersHook.filters.sort || 'popular',
              grant: filtersHook.filters.grant || 'all',
              submission: filtersHook.filters.submission || 'highest',
            }}
            hasMore={hasMore}
            activeFiltersCount={filtersHook.activeFiltersCount}
            onClearAllFilters={filtersHook.clearAllFilters}
            onLoadMore={handleLoadMore}
            onRetry={() => rfpsData.refetch()}
          />

          <RfpsSidebar
            filters={{
              search: filtersHook.filters.search || '',
              sort: filtersHook.filters.sort || 'popular',
              grant: filtersHook.filters.grant || 'all',
              submission: filtersHook.filters.submission || 'highest',
            }}
            activeFiltersCount={filtersHook.activeFiltersCount}
            showMobileFilters={showMobileFilters}
            topBounties={topBountiesQuery.data || []}
            topBountiesLoading={topBountiesQuery.isLoading}
            topBountiesError={topBountiesQuery.error}
            onFilterChange={(key, value) => {
              if (key === 'showMobileFilters') {
                setShowMobileFilters(value as boolean);
              } else {
                // Type-safe filter updates
                switch (key) {
                  case 'search':
                    filtersHook.updateFilter('search', value as string);
                    break;
                  case 'sort':
                    filtersHook.updateFilter('sort', value as string);
                    break;
                  case 'grant':
                    filtersHook.updateFilter('grant', value as string);
                    break;
                  case 'submission':
                    filtersHook.updateFilter('submission', value as string);
                    break;
                  default:
                    // Unknown filter key - ignore silently
                    break;
                }
              }
            }}
            onClearAllFilters={filtersHook.clearAllFilters}
          />
        </div>
      </div>
    </div>
  );
}

export default function RFPsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <RFPsPageContent />
    </QueryClientProvider>
  );
}