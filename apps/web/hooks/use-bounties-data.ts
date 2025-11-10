"use client";

import { useQuery } from "@tanstack/react-query";
import React from "react";
import { env } from "@/env";
import { bountyQueryKeys } from "./react-query";

const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

interface Bounty {
  id: string;
  title: string;
  slug: string;
  description: string;
  resources: Array<{
    url: string;
    title: string;
    description?: string;
  }> | null;
  screening: Array<{
    question: string;
    type: string;
    optional: boolean;
  }> | null;
  applicationUrl: string | null;
  skills: string[];
  organizationId: string;
  amount: string;
  amountUSD: number | null;
  token: string;
  winnings: Record<string, number> | null;
  split: "FIXED" | "EQUAL_SPLIT" | "VARIABLE";
  status: string;
  visibility: string;
  deadline: string | null;
  publishedAt: string;
  winnersAnnouncedAt: string | null;
  viewCount: number;
  submissionCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  lastReminderSentAt: string | null;
  lastWinnerReminderSentAt: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
}

interface BountiesResponse {
  bounties: Bounty[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    search: string;
    skills: string[];
    statuses: string[];
    sort: string;
    minAmount: number | null;
    maxAmount: number | null;
    hasSubmissions: boolean | null;
    hasDeadline: boolean | null;
  };
}

// Skills count item returned from the skills API
interface BountySkillCount {
  skill: string;
  count: number;
}

interface BountiesFilters {
  status?: string[];
  skills?: string[];
  sortBy?: string;
  priceRange?: [number, number];
  hasSubmissions?: boolean;
  hasDeadline?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export function fetchBountiesData(filters: BountiesFilters = {}) {
  const queryParams = new URLSearchParams();

  // search
  if (filters.search !== undefined && filters.search !== "") {
    queryParams.append("search", filters.search);
  }

  // status
  if (filters.status !== undefined && Array.isArray(filters.status)) {
    const statusValues = filters.status
      .map((s) => (s ?? "").toString().trim())
      .filter((s) => s !== "");
    if (statusValues.length > 0) {
      queryParams.append("status", statusValues.join(",").toLowerCase());
    }
  }
  // skills
  if (filters.skills !== undefined && Array.isArray(filters.skills)) {
    const skillsValues = filters.skills
      .map((s) => (s ?? "").toString().trim())
      .filter((s) => s !== "");
    if (skillsValues.length > 0) {
      queryParams.append("skills", skillsValues.join(","));
    }
  }
  // sortBy
  if (filters.sortBy !== undefined && filters.sortBy !== "") {
    queryParams.append("sort", filters.sortBy);
  }
  // priceRange
  if (
    filters.priceRange !== undefined &&
    filters.priceRange &&
    Array.isArray(filters.priceRange) &&
    filters.priceRange.length === 2 &&
    !(filters.priceRange[0] === 0 && filters.priceRange[1] === 50_000)
  ) {
    queryParams.append("minAmount", filters.priceRange[0].toString());
    queryParams.append("maxAmount", filters.priceRange[1].toString());
  }
  // hasSubmissions
  if (filters.hasSubmissions !== undefined && filters.hasSubmissions === true) {
    queryParams.append("hasSubmissions", "true");
  }
  // hasDeadline
  if (filters.hasDeadline !== undefined && filters.hasDeadline === true) {
    queryParams.append("hasDeadline", "true");
  }
  // pagination
  if (filters.page) {
    queryParams.append("page", filters.page.toString());
  }
  // limit
  if (filters.limit) {
    queryParams.append("limit", filters.limit.toString());
  }

  return useQuery({
    queryKey: bountyQueryKeys.list(filters),
    queryFn: async (): Promise<BountiesResponse> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/bounties?${queryParams.toString()}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Bounties API endpoint not found");
          }
          if (response.status >= 500) {
            throw new Error("Server error. Please try again later.");
          }
          if (response.status === 429) {
            throw new Error(
              "Too many requests. Please wait a moment and try again."
            );
          }
          throw new Error(`Failed to fetch bounties (${response.status})`);
        }

        const data = await response.json();

        // Validate response structure
        if (!data || typeof data !== "object") {
          throw new Error("Invalid response format from server");
        }

        return data;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
}

// Hook for fetching bounties skills with counts
export function useBountiesSkills() {
  return useQuery({
    queryKey: bountyQueryKeys.skills(),
    queryFn: async (): Promise<BountySkillCount[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/bounties/skills`);

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Skills API endpoint not found");
          }
          if (res.status >= 500) {
            throw new Error("Server error while fetching skills");
          }
          throw new Error(`Failed to fetch bounty skills (${res.status})`);
        }

        const json = await res.json();

        // Validate response structure
        if (!json || typeof json !== "object") {
          throw new Error("Invalid skills response format");
        }

        // API returns { data: { skill, count }[] }
        const skills = json?.data ?? [];

        // Validate skills array structure
        if (!Array.isArray(skills)) {
          console.warn("Skills API returned non-array data, using empty array");
          return [];
        }

        return skills;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Network error while fetching skills");
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
}

// Hook for paginated bounties
export function useBountiesData(filters: BountiesFilters = {}) {
  const [allBounties, setAllBounties] = React.useState<Bounty[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Reset when filters change (except page)
  React.useEffect(() => {
    setAllBounties([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
  }, [filters]);

  // Fetch initial data
  const initialQuery = fetchBountiesData({ ...filters, page: 1 });

  // Update state when initial data loads
  React.useEffect(() => {
    if (initialQuery.data) {
      setAllBounties(initialQuery.data.bounties);
      setHasMore(
        initialQuery.data.bounties.length < initialQuery.data.pagination.total
      );
      setError(null);
    }
    if (initialQuery.error) {
      setError(initialQuery.error);
    }
  }, [initialQuery.data, initialQuery.error]);

  // Load more function
  const loadMore = React.useCallback(async () => {
    if (isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const nextPage = currentPage + 1;
      const queryParams = new URLSearchParams();

      // Add all filters except page
      if (filters.search !== undefined && filters.search !== "") {
        queryParams.append("search", filters.search);
      }
      if (filters.status !== undefined && Array.isArray(filters.status)) {
        const statusValues = filters.status
          .map((s) => (s ?? "").toString().trim())
          .filter((s) => s !== "");
        if (statusValues.length > 0) {
          queryParams.append("status", statusValues.join(",").toLowerCase());
        }
      }
      if (filters.skills !== undefined && Array.isArray(filters.skills)) {
        const skillsValues = filters.skills
          .map((s) => (s ?? "").toString().trim())
          .filter((s) => s !== "");
        if (skillsValues.length > 0) {
          queryParams.append("skills", skillsValues.join(","));
        }
      }
      if (filters.sortBy !== undefined && filters.sortBy !== "") {
        queryParams.append("sort", filters.sortBy);
      }
      if (
        filters.priceRange !== undefined &&
        filters.priceRange &&
        Array.isArray(filters.priceRange) &&
        filters.priceRange.length === 2 &&
        !(filters.priceRange[0] === 0 && filters.priceRange[1] === 50_000)
      ) {
        queryParams.append("minAmount", filters.priceRange[0].toString());
        queryParams.append("maxAmount", filters.priceRange[1].toString());
      }
      if (
        filters.hasSubmissions !== undefined &&
        filters.hasSubmissions === true
      ) {
        queryParams.append("hasSubmissions", "true");
      }
      if (filters.hasDeadline !== undefined && filters.hasDeadline === true) {
        queryParams.append("hasDeadline", "true");
      }
      if (filters.limit) {
        queryParams.append("limit", filters.limit.toString());
      }

      // Add page parameter
      queryParams.append("page", nextPage.toString());

      const response = await fetch(
        `${API_BASE_URL}/api/v1/bounties?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch bounties (${response.status})`);
      }

      const data: BountiesResponse = await response.json();

      // Append new bounties to existing ones
      setAllBounties((prev) => [...prev, ...data.bounties]);
      setCurrentPage(nextPage);

      // Check if there are more pages
      const totalLoaded = allBounties.length + data.bounties.length;
      setHasMore(totalLoaded < data.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load more bounties")
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoadingMore, filters, allBounties.length]);

  return {
    bounties: allBounties,
    isLoading: initialQuery.isLoading,
    isLoadingMore,
    error: error || initialQuery.error,
    hasMore,
    loadMore,
    refetch: initialQuery.refetch,
  };
}

// Export types for use in components
export type { Bounty, BountiesResponse, BountiesFilters, BountySkillCount };
