"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { RFPsFilters } from "./use-rfps-data";

export function useRfpsFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Debounce ref for search updates
  const searchDebounceRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    },
    []
  );

  // Parse current filters from URL
  const filters = useMemo((): RFPsFilters => {
    const params = new URLSearchParams(searchParams);

    return {
      search: params.get("search") || "",
      status: params.get("status")?.split(",").filter(Boolean) || ["open"],
      sort: params.get("sort") || "popular",
      grant: params.get("grant") || "all",
      submission: params.get("submission") || "highest",
      page: Number.parseInt(params.get("page") || "1"),
      limit: Number.parseInt(params.get("limit") || "10"),
    };
  }, [searchParams]);

  // Count active filters (excluding defaults)
  const activeFiltersCount = useMemo(() => {
    let count = 0;

    // Sort filter (if not default "popular")
    if (filters.sort && filters.sort !== "popular") {
      count++;
    }

    // Grant filter (if not default "all")
    if (filters.grant && filters.grant !== "all") {
      count++;
    }

    // Submission filter (if not default "highest")
    if (filters.submission && filters.submission !== "highest") {
      count++;
    }

    // Search query (if not empty)
    if (filters.search?.trim()) {
      count++;
    }

    // Status filter (if not default [OPEN])
    if (
      filters.status &&
      filters.status.length > 0 &&
      !(filters.status.length === 1 && filters.status[0] === "OPEN")
    ) {
      count++;
    }

    return count;
  }, [filters]);

  // Update URL with new filters
  const updateURL = useCallback(
    (newFilters: Partial<RFPsFilters>, replace = true) => {
      const params = new URLSearchParams(searchParams);

      // Merge with current filters
      const updatedFilters = { ...filters, ...newFilters };

      // Update URL parameters
      if (updatedFilters.search?.trim()) {
        params.set("search", updatedFilters.search);
      } else {
        params.delete("search");
      }

      if (
        updatedFilters.status &&
        updatedFilters.status.length > 0 &&
        !(
          updatedFilters.status.length === 1 &&
          updatedFilters.status[0] === "OPEN"
        )
      ) {
        params.set("status", updatedFilters.status.join(","));
      } else {
        params.delete("status");
      }

      if (updatedFilters.sort && updatedFilters.sort !== "popular") {
        params.set("sort", updatedFilters.sort);
      } else {
        params.delete("sort");
      }

      if (updatedFilters.grant && updatedFilters.grant !== "all") {
        params.set("grant", updatedFilters.grant);
      } else {
        params.delete("grant");
      }

      if (
        updatedFilters.submission &&
        updatedFilters.submission !== "highest"
      ) {
        params.set("submission", updatedFilters.submission);
      } else {
        params.delete("submission");
      }

      if (updatedFilters.page && updatedFilters.page > 1) {
        params.set("page", updatedFilters.page.toString());
      } else {
        params.delete("page");
      }

      if (updatedFilters.limit && updatedFilters.limit !== 10) {
        params.set("limit", updatedFilters.limit.toString());
      } else {
        params.delete("limit");
      }

      const url = `${window.location.pathname}?${params.toString()}`;
      if (replace) {
        router.replace(url, { scroll: false });
      } else {
        router.push(url, { scroll: false });
      }
    },
    [searchParams, router, filters]
  );

  // Individual filter update functions
  const updateFilter = useCallback(
    (key: keyof RFPsFilters, value: RFPsFilters[typeof key]) => {
      const updates: Partial<RFPsFilters> = { [key]: value };

      // Reset page when changing filters (except page itself)
      if (key !== "page") {
        updates.page = 1;
      }

      // Debounce search updates for better performance
      if (key === "search") {
        if (searchDebounceRef.current) {
          window.clearTimeout(searchDebounceRef.current);
        }
        searchDebounceRef.current = window.setTimeout(() => {
          updateURL(updates);
          searchDebounceRef.current = null;
        }, 300);
        return;
      }

      updateURL(updates);
    },
    [updateURL]
  );

  const toggleStatus = useCallback(
    (status: string) => {
      const currentStatuses = filters.status || ["open"];
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter((s) => s !== status)
        : [...currentStatuses, status];
      updateFilter("status", newStatuses);
    },
    [filters.status, updateFilter]
  );

  const clearAllFilters = useCallback(() => {
    const defaultFilters: RFPsFilters = {
      search: "",
      status: ["open"],
      sort: "popular",
      grant: "all",
      submission: "highest",
      page: 1,
      limit: 10,
    };

    updateURL(defaultFilters);
  }, [updateURL]);

  return {
    filters,
    activeFiltersCount,
    updateFilter,
    toggleStatus,
    clearAllFilters,
    hasActiveFilters: activeFiltersCount > 0,
  };
}
