"use client";

import React from 'react'
import { Button } from "@packages/base/components/ui/button"
import { Checkbox } from "@packages/base/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@packages/base/components/ui/radio-group"
import { X } from "lucide-react"
import { TopBountiesCard } from "./top-bounties"

interface RfpsFilters {
  search: string;
  status: string[];
  sort: string;
  grant: string;
  submission: string;
}

interface TopBounty {
  id: string;
  slug: string;
  title: string;
  voteCount: number;
  organization: {
    name: string;
  };
}

interface RfpsSidebarProps {
  filters: RfpsFilters;
  activeFiltersCount: number;
  showMobileFilters: boolean;
  topBounties: TopBounty[];
  topBountiesLoading: boolean;
  topBountiesError: Error | null;
  onFilterChange: {
    onSortChange: (value: string) => void;
    onGrantChange: (value: string) => void;
    onSubmissionChange: (value: string) => void;
    onMobileFiltersToggle: (show: boolean) => void;
  };
  onStatusToggle: (status: string) => void;
  onClearAllFilters: () => void;
}

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "recent", label: "Most Recent" },
  { value: "most_applications", label: "Most Applications" },
  { value: "least_applications", label: "Least Applications" },
];

const GRANT_OPTIONS = [
  { value: "all", label: "All Grants" },
  { value: "official", label: "Official Only" },
];

const SUBMISSION_OPTIONS = [
  { value: "highest", label: "Highest" },
  { value: "lowest", label: "Lowest" },
];

function RfpsSidebarComponent({
  filters,
  activeFiltersCount,
  showMobileFilters,
  topBounties,
  topBountiesLoading,
  topBountiesError,
  onFilterChange: {
    onSortChange,
    onGrantChange,
    onSubmissionChange,
    onMobileFiltersToggle,
  },
  onStatusToggle,
  onClearAllFilters,
}: RfpsSidebarProps) {
  const getGradientClass = (index: number) => {
    switch (index) {
      case 0:
        return "from-pink-500 to-purple-600";
      case 1:
        return "from-blue-500 to-cyan-600";
      case 2:
        return "from-green-500 to-emerald-600";
      case 3:
        return "from-orange-500 to-red-600";
      default:
        return "from-purple-500 to-pink-600";
    }
  };
  return (
    <>
      {/* Mobile Overlay */}
      {showMobileFilters && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => onMobileFiltersToggle(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onMobileFiltersToggle(false);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Close mobile filters"
        />
      )}

      {/* Sidebar Content */}
      <div className={`space-y-6 ${showMobileFilters ? 'fixed top-0 right-0 z-50 h-full w-80 overflow-y-auto bg-[#111111] p-6 lg:relative lg:top-auto lg:right-auto lg:z-auto lg:h-auto lg:w-auto lg:bg-transparent lg:p-0' : "hidden lg:block"}`}>
        {/* Mobile Close Button */}
        {showMobileFilters && (
          <div className='mb-4 flex justify-end lg:hidden'>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onMobileFiltersToggle(false)}
              className="h-8 w-8 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Filters */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading font-semibold text-lg">Filters</h3>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAllFilters}
                className="text-sm text-white/60 hover:text-white"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Status */}
          <div className="mb-6">
            <h4 className="mb-3 font-medium text-sm text-white/80">Status</h4>
            <div className="grid grid-cols-2 gap-4">
              {" "}
              {/*Each option stays as a horizontal pair (radio + label) on mobile*/}
              {STATUS_OPTIONS.map((status) => (
                <label
                  key={status.value}
                  htmlFor={`status-${status.value.toLowerCase()}`}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Checkbox
                    id={`status-${status.value.toLowerCase()}`}
                    checked={filters.status.includes(status.value)}
                    onCheckedChange={() => onStatusToggle(status.value)}
                    className="border-white/40 data-[state=checked]:border-pink-500 data-[state=checked]:bg-pink-500"
                  />
                  <span className="text-sm text-white/70">{status.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div className="mb-6">
            <h4 className="mb-3 font-medium text-sm text-white/80">Sort By</h4>
            <RadioGroup value={filters.sort} onValueChange={onSortChange}>
              <div className="grid grid-cols-2 gap-4">
                {" "}
                {/*Each option stays as a horizontal pair (radio + label) on mobile*/}
                {SORT_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`sort-${option.value}`}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <RadioGroupItem
                      id={`sort-${option.value}`}
                      value={option.value}
                      className="border-white/40 text-pink-500"
                    />
                    <span className="text-sm text-white/70">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Grant */}
          <div className="mb-6">
            <h4 className="mb-3 font-medium text-sm text-white/80">Grant</h4>
            <RadioGroup value={filters.grant} onValueChange={onGrantChange}>
              <div className="grid grid-cols-2 gap-4">
                {" "}
                {/*Each option stays as a horizontal pair (radio + label) on mobile*/}
                {GRANT_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`grant-${option.value}`}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <RadioGroupItem
                      id={`grant-${option.value}`}
                      value={option.value}
                      className="border-white/40 text-pink-500"
                    />
                    <span className="text-sm text-white/70">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Submission */}
          <div>
            <h4 className="mb-3 font-medium text-sm text-white/80">
              Submission
            </h4>
            <RadioGroup
              value={filters.submission}
              onValueChange={onSubmissionChange}
            >
              <div className="grid grid-cols-2 gap-4">
                {SUBMISSION_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`submission-${option.value}`}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <RadioGroupItem
                      id={`submission-${option.value}`}
                      value={option.value}
                      className="border-white/40 text-pink-500"
                    />
                    <span className="text-sm text-white/70">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Top Bounties - Hidden on mobile, shown on desktop */}
          <TopBountiesCard
            topBounties={topBounties}
            topBountiesLoading={topBountiesLoading}
            topBountiesError={topBountiesError}
            className='hidden lg:block'
          />
      </div>
    </>
  );
}

// Memoize the component for performance
export const RfpsSidebar = React.memo(RfpsSidebarComponent);
