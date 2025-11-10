"use client";

import { Button } from "@packages/base/components/ui/button";
import { Checkbox } from "@packages/base/components/ui/checkbox";
import {
  RadioGroup,
  RadioGroupItem,
} from "@packages/base/components/ui/radio-group";
import { Slider } from "@packages/base/components/ui/slider";
import { X } from "lucide-react";
import React from "react";
import { HowItWorksCard } from "./how-it-works";

interface BountyFilters {
  status: string[];
  skills: string[];
  sortBy: string;
  priceRange: [number, number];
  hasSubmissions: boolean;
  hasDeadline: boolean;
}

interface BountiesSidebarProps {
  filters: BountyFilters;
  activeFiltersCount: number;
  showMobileFilters: boolean;
  onFilterChange: {
    onSortChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onSkillsChange: (value: string[]) => void;
    onPriceRangeChange: (value: [number, number]) => void;
    onHasSubmissionsChange: (value: boolean) => void;
    onHasDeadlineChange: (value: boolean) => void;
    onMobileFiltersToggle: (show: boolean) => void;
  };
  onStatusToggle: (status: string) => void;
  onClearAllFilters: () => void;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "amount_high", label: "Highest Amount" },
  { value: "amount_low", label: "Lowest Amount" },
  { value: "submissions", label: "Most Submissions" },
  { value: "deadline", label: "Deadline Soon" },
  { value: "views", label: "Most Views" },
];

function BountiesSidebarComponent({
  filters,
  activeFiltersCount,
  showMobileFilters,
  onFilterChange,
  onStatusToggle,
  onClearAllFilters,
}: BountiesSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {showMobileFilters && (
        <div
          aria-label="Close mobile filters"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => onFilterChange.onMobileFiltersToggle(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onFilterChange.onMobileFiltersToggle(false);
            }
          }}
          role="button"
          tabIndex={0}
        />
      )}

      {/* Sidebar Content */}
      <div
        className={`space-y-6 ${showMobileFilters ? "fixed top-0 right-0 z-50 h-full w-90 translate-x-0 transform-gpu overflow-y-auto bg-[#111111] p-6 opacity-100 transition-opacity transition-transform duration-300 ease-out lg:relative lg:top-auto lg:right-auto lg:z-auto lg:h-auto lg:w-auto lg:bg-transparent lg:p-0" : "pointer-events-none fixed top-0 right-0 z-40 h-full w-90 translate-x-full transform-gpu overflow-y-auto bg-[#111111] p-6 opacity-0 transition-opacity transition-transform duration-300 ease-out lg:pointer-events-auto lg:relative lg:top-auto lg:right-auto lg:z-auto lg:h-auto lg:w-auto lg:translate-x-0 lg:bg-transparent lg:p-0 lg:opacity-100"}`}
      >
        {/* Mobile Close Button */}
        {showMobileFilters && (
          <div className="mb-4 flex justify-end lg:hidden">
            <Button
              aria-label="Close filters"
              className="h-8 w-8 text-white/60 hover:bg-white/10 hover:text-white"
              onClick={() => onFilterChange.onMobileFiltersToggle(false)}
              size="icon"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Filters */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-heading font-semibold text-lg">Filters</h3>
            {activeFiltersCount > 0 && (
              <Button
                className="text-sm text-white/60 hover:text-white"
                onClick={onClearAllFilters}
                size="sm"
                variant="ghost"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Status */}
          <div className="mb-6">
            <h4 className="mb-3 font-medium text-sm text-white/80">Status</h4>
            <div className="flex items-center justify-between align-center">
              {["Open", "In Review", "Completed"].map((status) => (
                <label
                  className="flex cursor-pointer items-center gap-2"
                  htmlFor={`status-${status.toLowerCase().replace(" ", "-")}`}
                  key={status}
                >
                  <Checkbox
                    checked={filters.status.includes(status.toLowerCase())}
                    className="border-white/40 data-[state=checked]:border-pink-500 data-[state=checked]:bg-pink-500"
                    id={`status-${status.toLowerCase().replace(" ", "-")}`}
                    onCheckedChange={() => onStatusToggle(status.toLowerCase())}
                  />
                  <span className="text-sm text-white/70">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div className="mb-6">
            <h4 className="mb-3 font-medium text-sm text-white/80">Sort By</h4>
            <RadioGroup
              onValueChange={(value) => onFilterChange.onSortChange(value)}
              value={filters.sortBy}
            >
              <div className="grid grid-cols-2 gap-4">
                {SORT_OPTIONS.map((option) => (
                  <div
                    className="flex items-center space-x-2"
                    key={option.value}
                  >
                    <RadioGroupItem
                      className="border-white/40 text-pink-500"
                      id={option.value}
                      value={option.value}
                    />
                    <label
                      className="cursor-pointer font-medium text-sm text-white/70 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      htmlFor={option.value}
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <h4 className="mb-3 font-medium text-sm text-white/80">
              Bounty Amount Range
            </h4>
            <div className="space-y-4">
              <Slider
                className="[&_[role=slider]]:bg-pink-500"
                max={50_000}
                onValueChange={(value) =>
                  onFilterChange.onPriceRangeChange(value as [number, number])
                }
                step={500}
                value={filters.priceRange}
              />
              <div className="flex justify-between text-sm text-white/60">
                <span>${filters.priceRange[0].toLocaleString()}</span>
                <span>${filters.priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Additional Filters */}
          <div>
            <h4 className="mb-3 font-medium text-sm text-white/80">
              Additional
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <label
                className="flex cursor-pointer items-center gap-2"
                htmlFor="has-submissions"
              >
                <Checkbox
                  checked={filters.hasSubmissions}
                  className="border-white/40 data-[state=checked]:border-pink-500 data-[state=checked]:bg-pink-500"
                  id="has-submissions"
                  onCheckedChange={(checked) =>
                    onFilterChange.onHasSubmissionsChange(!!checked)
                  }
                />
                <span className="text-sm text-white/70">Has Submissions</span>
              </label>
              <label
                className="flex cursor-pointer items-center gap-2"
                htmlFor="has-deadline"
              >
                <Checkbox
                  checked={filters.hasDeadline}
                  className="border-white/40 data-[state=checked]:border-pink-500 data-[state=checked]:bg-pink-500"
                  id="has-deadline"
                  onCheckedChange={(checked) =>
                    onFilterChange.onHasDeadlineChange(!!checked)
                  }
                />
                <span className="text-sm text-white/70">Has Deadline</span>
              </label>
            </div>
          </div>
        </div>

        {/* How it works - Desktop Only */}
        <div className="hidden lg:block">
          <HowItWorksCard />
        </div>
      </div>
    </>
  );
}

// Memoize the component for performance
export const BountiesSidebar = React.memo(BountiesSidebarComponent);
