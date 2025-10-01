"use client";

import React from "react";
import { useQuery } from '@tanstack/react-query';
import { grantQueryKeys } from './react-query';
import { env } from "@/env";
import type { Prisma } from "@packages/db";

const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

// Use Prisma types for Grant with organization relation
type Grant = Prisma.GrantGetPayload<{
  include: {
    organization: {
      select: {
        id: true;
        name: true;
        slug: true;
        logo: true;
      };
    };
  };
}>;

interface GrantsResponse {
  grants: Grant[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// Skills count item returned from the skills API
interface GrantSkillCount {
  skill: string;
  count: number;
}

interface GrantsFilters {
  status?: string[];
  skills?: string[];
  search?: string;
  sortBy?: string;
  priceRange?: [number, number];
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export function fetchGrantsData(filters: GrantsFilters = {}) {
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
  if (
    filters.sortBy !== undefined &&
    filters.sortBy !== "" &&
    filters.sortBy !== "newest"
  ) {
    queryParams.append("sort", filters.sortBy);
  }

  // priceRange
  if (
    filters.priceRange !== undefined &&
    filters.priceRange &&
    Array.isArray(filters.priceRange) &&
    filters.priceRange.length === 2 &&
    !(filters.priceRange[0] === 0 && filters.priceRange[1] === 100000)
  ) {
    queryParams.append("minAmount", filters.priceRange[0].toString());
    queryParams.append("maxAmount", filters.priceRange[1].toString());
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
    queryKey: grantQueryKeys.list(filters),
    queryFn: async (): Promise<GrantsResponse> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/grants?${queryParams.toString()}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Grants API endpoint not found");
          }
          if (response.status >= 500) {
            throw new Error("Server error. Please try again later.");
          }
          if (response.status === 429) {
            throw new Error(
              "Too many requests. Please wait a moment and try again."
            );
          }
          throw new Error(`Failed to fetch grants (${response.status})`);
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

// Hook for fetching grants skills with counts
export function useGrantsSkills() {
  return useQuery({
    queryKey: grantQueryKeys.skills(),
    queryFn: async (): Promise<GrantSkillCount[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/grants/skills`);

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Skills API endpoint not found");
          }
          if (res.status >= 500) {
            throw new Error("Server error while fetching skills");
          }
          throw new Error(`Failed to fetch grant skills (${res.status})`);
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

// Hook for fetching top RFPs
export function useTopRFPs() {
  return useQuery({
    queryKey: ["top", "rfps"],
    queryFn: async (): Promise<TopRfp[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/top/rfps`);
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Top RFPs API endpoint not found");
          }
          if (res.status >= 500) {
            throw new Error("Server error while fetching top RFPs");
          }
          throw new Error(`Failed to fetch top RFPs (${res.status})`);
        }

        const json = await res.json();

        // Validate response structure
        if (!json || typeof json !== "object") {
          throw new Error("Invalid top RFPs response format");
        }

        // API returns { data: TopRfp[] }
        const rfps = json?.data ?? [];

        // Validate RFPs array structure
        if (!Array.isArray(rfps)) {
          return [];
        }

        return rfps;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Network error while fetching top RFPs");
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

// Top RFP interface
interface TopRfp {
  id: string;
  title: string;
  voteCount: number;
  grant: {
    organization: {
      name: string;
    };
  };
}

export function useGrantsData(filters: GrantsFilters = {}) {
  const [allGrants, setAllGrants] = React.useState<Grant[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Reset when filters change (except page)
  React.useEffect(() => {
    setAllGrants([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
  }, [
    filters.search,
    filters.status,
    filters.skills,
    filters.sortBy,
    filters.priceRange
  ]);

  // Fetch initial data
  const initialQuery = fetchGrantsData({ ...filters, page: 1 });

  // Update state when initial data loads
  React.useEffect(() => {
    if (initialQuery.data) {
      setAllGrants(initialQuery.data.grants);
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
      if (filters.skills !== undefined && Array.isArray(filters.skills)) {
        const skillsValues = filters.skills
          .map((s) => (s ?? '').toString().trim())
          .filter((s) => s !== '');
        if (skillsValues.length > 0) {
          queryParams.append('skills', skillsValues.join(','));
        }
      }
      if (filters.sortBy !== undefined && filters.sortBy !== '' && filters.sortBy !== 'newest') {
        queryParams.append('sort', filters.sortBy);
      }
      if (
        filters.priceRange !== undefined && 
        filters.priceRange &&
        Array.isArray(filters.priceRange) &&
        filters.priceRange.length === 2 &&
        !(filters.priceRange[0] === 0 && filters.priceRange[1] === 100000)
      ) {
        queryParams.append('minAmount', filters.priceRange[0].toString());
        queryParams.append('maxAmount', filters.priceRange[1].toString());
      }
      if (filters.limit) {
        queryParams.append('limit', filters.limit.toString());
      }

      // Add page parameter
      queryParams.append('page', nextPage.toString());

      const response = await fetch(`${API_BASE_URL}/api/v1/grants?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch grants (${response.status})`);
      }
      
      const data: GrantsResponse = await response.json();
      
      // Append new grants to existing ones
      setAllGrants(prev => [...prev, ...data.grants]);
      setCurrentPage(nextPage);
      
      // Check if there are more pages
      setHasMore(data.pagination.hasMore);
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more grants'));
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, hasMore, isLoadingMore, filters]);

  return {
    grants: allGrants,
    isLoading: initialQuery.isLoading,
    isLoadingMore,
    error: error || initialQuery.error,
    hasMore,
    loadMore,
    refetch: initialQuery.refetch
  };
}

// Export types for use in components
export type { Grant, GrantsResponse, GrantsFilters, GrantSkillCount, TopRfp };
