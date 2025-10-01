"use client";

import React from "react";
import { useQuery } from '@tanstack/react-query';
import { rfpQueryKeys, topQueryKeys } from './react-query';
import { env } from "@/env";
import type { Prisma } from "@packages/db";

const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

interface RFP {
  id: string;
  title: string;
  description: string;
  grant: {
    id: string;
    title: string;
    organization: {
      id: string;
      name: string;
      slug: string;
      logo: string | null;
    };
  };
  voteCount: number;
  commentCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface RFPsResponse {
  rfps: RFP[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

interface RFPsFilters {
  search?: string;
  status?: string[];
  sort?: string;
  grant?: string;
  submission?: string;
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export function fetchRfpsData(filters: RFPsFilters = {}) {
  const queryParams = new URLSearchParams();

  // search
  if (filters.search !== undefined && filters.search !== "") {
    queryParams.append("search", filters.search);
  }

  // status
  if (
    filters.status !== undefined &&
    Array.isArray(filters.status) &&
    filters.status.length > 0
  ) {
    queryParams.append("status", filters.status.join(","));
  }

  // sort
  if (
    filters.sort !== undefined &&
    filters.sort !== "" &&
    filters.sort !== "popular"
  ) {
    queryParams.append("sort", filters.sort);
  }

  // grant
  if (
    filters.grant !== undefined &&
    filters.grant !== "" &&
    filters.grant !== "all"
  ) {
    queryParams.append("grant", filters.grant);
  }

  // submission
  if (
    filters.submission !== undefined &&
    filters.submission !== "" &&
    filters.submission !== "highest"
  ) {
    queryParams.append("submission", filters.submission);
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
    queryKey: rfpQueryKeys.list(filters),
    queryFn: async (): Promise<RFPsResponse> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/rfps?${queryParams.toString()}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("RFPs API endpoint not found");
          }
          if (response.status >= 500) {
            throw new Error("Server error. Please try again later.");
          }
          if (response.status === 429) {
            throw new Error(
              "Too many requests. Please wait a moment and try again."
            );
          }
          throw new Error(`Failed to fetch RFPs (${response.status})`);
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

// Top Bounty interface
interface TopBounty {
  id: string;
  title: string;
  voteCount: number;
  organization: {
    name: string;
  };
}

// Hook for fetching top bounties
export function useTopBounties() {
  return useQuery({
    queryKey: topQueryKeys.bounties(),
    queryFn: async (): Promise<TopBounty[]> => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/top/bounties`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Top bounties API endpoint not found");
          }
          if (response.status >= 500) {
            throw new Error("Server error while fetching top bounties");
          }
          throw new Error(`Failed to fetch top bounties (${response.status})`);
        }

        const data = await response.json();

        // Validate response structure
        if (!data || typeof data !== "object") {
          throw new Error("Invalid top bounties response format");
        }

        // API returns { data: TopBounty[] }
        const bounties = data?.data ?? [];

        // Validate bounties array structure
        if (!Array.isArray(bounties)) {
          return [];
        }

        return bounties;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Network error while fetching top bounties");
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
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

export function useRfpsData(filters: RFPsFilters = {}) {
  const [allRfps, setAllRfps] = React.useState<RFP[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Reset when filters change (except page)
  React.useEffect(() => {
    setAllRfps([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
  }, [
    filters.search,
    filters.status,
    filters.sort,
    filters.grant,
    filters.submission
  ]);

  // Fetch initial data
  const initialQuery = fetchRfpsData({ ...filters, page: 1 });

  // Update state when initial data loads
  React.useEffect(() => {
    if (initialQuery.data) {
      setAllRfps(initialQuery.data.rfps);
      setHasMore(initialQuery.data.pagination.hasMore);
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
      if (filters.search !== undefined && filters.search !== '') {
        queryParams.append('search', filters.search);
      }
      if (filters.status !== undefined && Array.isArray(filters.status) && filters.status.length > 0) {
        queryParams.append('status', filters.status.join(','));
      }
      if (filters.sort !== undefined && filters.sort !== '' && filters.sort !== 'popular') {
        queryParams.append('sort', filters.sort);
      }
      if (filters.grant !== undefined && filters.grant !== '' && filters.grant !== 'all') {
        queryParams.append('grant', filters.grant);
      }
      if (filters.submission !== undefined && filters.submission !== '' && filters.submission !== 'highest') {
        queryParams.append('submission', filters.submission);
      }
      if (filters.limit) {
        queryParams.append('limit', filters.limit.toString());
      }

      // Add page parameter
      queryParams.append('page', nextPage.toString());

      const response = await fetch(`${API_BASE_URL}/api/v1/rfps?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch RFPs (${response.status})`);
      }
      
      const data: RFPsResponse = await response.json();
      
      // Append new RFPs to existing ones
      setAllRfps(prev => [...prev, ...data.rfps]);
      setCurrentPage(nextPage);
      
      // Check if there are more pages
      setHasMore(data.pagination.hasMore);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more RFPs'));
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoadingMore, filters]);

  return {
    rfps: allRfps,
    isLoading: initialQuery.isLoading,
    isLoadingMore,
    error: error || initialQuery.error,
    hasMore,
    loadMore,
    refetch: initialQuery.refetch
  };
}

// Export types for use in components
export type { RFP, RFPsResponse, RFPsFilters, TopBounty };
