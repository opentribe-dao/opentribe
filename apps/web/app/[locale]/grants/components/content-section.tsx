"use client";

import { Button } from "@packages/base/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@packages/base/components/ui/empty";
import { Skeleton } from "@packages/base/components/ui/skeleton";
import { getSkillLabel } from "@packages/base/lib/skills";
import React from "react";
import type { Grant } from "@/hooks/use-grants-data";
import { GrantCard } from "../../components/cards/grant-card";
import { type TopRFP, TopRFPsCard } from "./top-rfps";

interface GrantFilters {
  status: string[];
  sortBy: string;
  priceRange: [number, number];
}

interface GrantsContentSectionProps {
  grants: Grant[];
  loading: boolean;
  error: Error | null;
  selectedSkills: string[];
  skillsOptions: string[];
  filters: GrantFilters;
  hasMore: boolean;
  isLoadingMore: boolean;
  activeFiltersCount: number;
  onSkillToggle: (skill: string) => void;
  onClearAllFilters: () => void;
  onLoadMore: () => void;
  onRetry: () => void;
  topRFPs: TopRFP[];
  topRFPsLoading: boolean;
  topRFPsError: Error | null;
}

function GrantsContentSectionComponent({
  grants,
  loading,
  error,
  selectedSkills,
  skillsOptions,
  hasMore,
  isLoadingMore,
  activeFiltersCount,
  onSkillToggle,
  onClearAllFilters,
  onLoadMore,
  onRetry,
  topRFPs,
  topRFPsLoading,
  topRFPsError,
}: GrantsContentSectionProps) {
  return (
    <div className="lg:col-span-3">
      <div className="mb-4">
        <div className="relative">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto py-2">
            {loading && skillsOptions.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    className="h-8 w-24 flex-shrink-0 animate-pulse rounded-lg bg-white/10"
                    key={i}
                  />
                ))
              : skillsOptions.map((skill) => (
                  <button
                    aria-label={`Filter by ${skill} skill`}
                    aria-pressed={selectedSkills.includes(skill)}
                    className={`flex-shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 font-medium text-sm transition-all duration-200 ${
                      selectedSkills.includes(skill)
                        ? "border-pink-400 bg-pink-500/20 text-pink-300"
                        : "border-white/20 bg-white/10 text-white/70 hover:border-pink-400/50 hover:bg-white/20"
                    }`}
                    key={skill}
                    onClick={() => onSkillToggle(skill)}
                    type="button"
                  >
                    {getSkillLabel(skill)}
                  </button>
                ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-6">
          <div className="mb-2 font-semibold text-red-400">
            Error loading grants
          </div>
          <div className="mb-4 text-red-300 text-sm">
            {error.message ||
              "Something went wrong while loading grants. Please try again."}
          </div>
          <div className="flex gap-3">
            <Button className="bg-red-500 hover:bg-red-600" onClick={onRetry}>
              Try Again
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                className="border-red-500/20 text-red-300 hover:bg-red-500/10"
                onClick={onClearAllFilters}
                variant="outline"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && grants.length === 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton className="h-[466px] rounded-2xl" key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!(loading || error) && grants.length === 0 && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>No grants found</EmptyTitle>
            <EmptyDescription>
              {activeFiltersCount > 0
                ? "Try adjusting your filters to see more grants."
                : "There are no grants available at the moment."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {/* Grants Grid */}
      {!loading && grants.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-1 xl:grid-cols-1">
            {grants.map((grant) => (
              <GrantCard
                applicationCount={grant.applicationCount}
                bannerUrl={grant.bannerUrl}
                createdAt={grant.createdAt}
                id={grant.id}
                key={grant.id}
                maxAmount={grant.maxAmount}
                minAmount={grant.minAmount}
                organization={grant.organization}
                rfpCount={grant.rfpCount}
                skills={grant.skills}
                slug={grant.slug}
                status={grant.status}
                summary={grant.summary}
                title={grant.title}
                token={grant.token}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-8 text-center">
              <Button
                className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
                disabled={isLoadingMore}
                onClick={onLoadMore}
                variant="outline"
              >
                {isLoadingMore ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Loading more grants...
                  </div>
                ) : (
                  "View More →"
                )}
              </Button>
            </div>
          )}

          {/* Top RFPs - Mobile Only */}
          <TopRFPsCard
            className="mt-6 lg:hidden"
            topRFPs={topRFPs}
            topRFPsError={topRFPsError}
            topRFPsLoading={topRFPsLoading}
          />
        </>
      )}

      {/* Loading More State */}
      {loading && grants.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton className="h-[466px] rounded-2xl" key={`loading-${i}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// Memoize the component for performance
export const GrantsContentSection = React.memo(GrantsContentSectionComponent);
