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
import type { Bounty } from "@/hooks/use-bounties-data";
import { BountyCard } from "../../components/cards/bounty-card";
import { HowItWorksCard } from "./how-it-works";

interface BountyFilters {
  status: string[];
  sortBy: string;
  priceRange: [number, number];
  hasSubmissions: boolean;
  hasDeadline: boolean;
}

interface BountiesContentSectionProps {
  bounties: Bounty[];
  loading: boolean;
  error: Error | null;
  selectedSkills: string[];
  skillsOptions: string[];
  filters: BountyFilters;
  hasMore: boolean;
  isLoadingMore: boolean;
  activeFiltersCount: number;
  onSkillToggle: (skill: string) => void;
  onClearAllFilters: () => void;
  onLoadMore: () => void;
  onRetry: () => void;
}

function BountiesContentSectionComponent({
  bounties,
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
}: BountiesContentSectionProps) {
  return (
    <div className="lg:col-span-3">
      <div className="mb-4">
        <div className="relative">
          <div
            className={`scrollbar-hide flex gap-2 overflow-x-auto${bounties.length === 0 ? "" : "py-2"}`}
          >
            {loading && skillsOptions.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div
                    className="h-8 w-24 flex-shrink-0 animate-pulse rounded-lg bg-white/10"
                    key={i}
                  />
                ))
              : skillsOptions.map((skill) => (
                  <button
                    className={`shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 font-medium text-sm transition-all duration-200 ${
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
          {/* <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-[#111111] to-transparent pointer-events-none" /> */}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-6">
          <div className="mb-2 font-semibold text-red-400">
            Error loading bounties
          </div>
          <div className="mb-4 text-red-300 text-sm">
            {error.message ||
              "Something went wrong while loading bounties. Please try again."}
          </div>
          <div className="flex gap-3">
            <Button
              className="border-red-500/40 text-red-300 hover:bg-red-500/10"
              onClick={onRetry}
              variant="outline"
            >
              Try Again
            </Button>
            <Button
              className="text-red-300 hover:bg-red-500/10"
              onClick={onClearAllFilters}
              variant="ghost"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <Skeleton className="h-[400px] rounded-2xl" key={i} />
          ))}
        </div>
      ) : bounties.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-1 xl:grid-cols-1">
            {bounties.map((bounty, index) => {
              // Add safety check and ensure all required props exist
              if (!bounty?.id) {
                console.warn(
                  `Bounty at index ${index} is missing required data:`,
                  bounty
                );
                return null;
              }

              return (
                <BountyCard
                  amount={bounty.amount}
                  amountUSD={bounty.amountUSD || null}
                  commentCount={bounty.commentCount || 0}
                  deadline={bounty.deadline}
                  description={bounty.description || "No description available"}
                  id={bounty.id}
                  key={bounty.id}
                  organization={bounty.organization}
                  skills={bounty.skills || []}
                  slug={bounty.slug}
                  status={bounty.status || "UNKNOWN"}
                  submissionCount={bounty.submissionCount || 0}
                  title={bounty.title || "Untitled Bounty"}
                  token={bounty.token || "DOT"}
                  variant="list"
                  winnersAnnouncedAt={bounty.winnersAnnouncedAt}
                />
              );
            })}
          </div>

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
                    Loading more...
                  </div>
                ) : (
                  "View More →"
                )}
              </Button>
            </div>
          )}

          {/* How it works - Mobile Only */}
          <HowItWorksCard className="mt-6 lg:hidden" />
        </>
      ) : loading ? null : (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>No bounties found</EmptyTitle>
            <EmptyDescription>
              {activeFiltersCount > 0
                ? "Try adjusting your filters to see more bounties."
                : "There are no bounties available at the moment."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}

// Memoize the component for performance
export const BountiesContentSection = React.memo(
  BountiesContentSectionComponent
);
