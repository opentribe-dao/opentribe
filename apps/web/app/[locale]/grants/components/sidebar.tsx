import { Button } from "@packages/base/components/ui/button";
import { Checkbox } from "@packages/base/components/ui/checkbox";
import {
  RadioGroup,
  RadioGroupItem,
} from "@packages/base/components/ui/radio-group";
import { Slider } from "@packages/base/components/ui/slider";
import { X } from "lucide-react";
import React from "react";
import { TopRFPsCard } from "./top-rfps";

interface GrantFilters {
  status: string[];
  sortBy: string;
  priceRange: [number, number];
}

interface TopRfp {
  id: string;
  slug: string;
  title: string;
  voteCount: number;
  grant: {
    organization: {
      name: string;
    };
  };
}

interface GrantsSidebarProps {
  filters: GrantFilters;
  activeFiltersCount: number;
  showMobileFilters: boolean;
  topRFPs: TopRfp[];
  topRFPsLoading: boolean;
  topRFPsError: Error | null;
  onFilterChange: {
    onSortChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onPriceRangeChange: (value: [number, number]) => void;
    onMobileFiltersToggle: (show: boolean) => void;
  };
  onStatusToggle: (status: string) => void;
  onClearAllFilters: () => void;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "max_amount", label: "Highest Amount" },
  { value: "min_amount", label: "Lowest Amount" },
  { value: "max_funds", label: "Highest Funds" },
  { value: "most_applications", label: "Most Applications" },
  { value: "most_rfps", label: "Most RFPs" },
];

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

function GrantsSidebarComponent({
  filters,
  activeFiltersCount,
  showMobileFilters,
  topRFPs,
  topRFPsLoading,
  topRFPsError,
  onFilterChange,
  onStatusToggle,
  onClearAllFilters,
}: GrantsSidebarProps) {
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
        className={`space-y-6 ${showMobileFilters ? "fixed top-0 right-0 z-50 h-full w-80 overflow-y-auto bg-[#111111] p-6 lg:relative lg:top-auto lg:right-auto lg:z-auto lg:h-auto lg:w-auto lg:bg-transparent lg:p-0" : "hidden lg:block"}`}
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
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
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
            <div className="grid grid-cols-2 gap-4">
              {" "}
              {/*Each option stays as a horizontal pair (radio + label) on mobile*/}
              {STATUS_OPTIONS.map((status) => (
                <label
                  className="flex cursor-pointer items-center gap-2"
                  htmlFor={`status-${status.value.toLowerCase()}`}
                  key={status.value}
                >
                  <Checkbox
                    checked={filters.status.includes(status.value)}
                    className="border-white/40 data-[state=checked]:border-pink-500 data-[state=checked]:bg-pink-500"
                    id={`status-${status.value.toLowerCase()}`}
                    onCheckedChange={() => onStatusToggle(status.value)}
                  />
                  <span className="text-sm text-white/70">{status.label}</span>
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
                  <label
                    className="flex cursor-pointer items-center gap-2"
                    htmlFor={`sort-${option.value}`}
                    key={option.value}
                  >
                    <RadioGroupItem
                      className="border-white/40 text-pink-500"
                      id={`sort-${option.value}`}
                      value={option.value}
                    />
                    <span className="text-sm text-white/70">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <h4 className="mb-3 font-medium text-sm text-white/80">
              Amount Range
            </h4>
            <div className="space-y-4">
              <Slider
                className="[&_[role=slider]]:bg-pink-500"
                max={100_000}
                onValueChange={(value) =>
                  onFilterChange.onPriceRangeChange(value as [number, number])
                }
                step={1000}
                value={filters.priceRange}
              />
              <div className="flex justify-between text-sm text-white/60">
                <span>${filters.priceRange[0].toLocaleString()}</span>
                <span>${filters.priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top RFPs - Hidden on mobile, shown on desktop */}
        <TopRFPsCard
          className="hidden lg:block"
          topRFPs={topRFPs}
          topRFPsError={topRFPsError}
          topRFPsLoading={topRFPsLoading}
        />
      </div>
    </>
  );
}

// Memoize the component for performance
export const GrantsSidebar = React.memo(GrantsSidebarComponent);
