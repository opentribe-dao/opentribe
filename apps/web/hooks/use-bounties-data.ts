"use client";

import { useQuery } from "@tanstack/react-query";
import { bountyQueryKeys } from "./react-query";
import { env } from "@/env";

const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

interface Bounty {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  skills: string[];
  deadline?: string;
  submissionCount: number;
  organization: {
    id: string;
    name: string;
    logo?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BountiesResponse {
  bounties: Bounty[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
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

// Hook for fetching bounties data with filters
export function useBountiesData(filters: BountiesFilters = {}) {
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
    !(filters.priceRange[0] === 0 && filters.priceRange[1] === 50000)
  ) {
    queryParams.append("minAmount", filters.priceRange[0].toString());
    queryParams.append("maxAmount", filters.priceRange[1].toString());
  }
  // hasSubmissions
  if (filters.hasSubmissions !== undefined && filters.hasSubmissions === true) {
    queryParams.append("hasSubmissions", filters.hasSubmissions.toString());
  }
  // hasDeadline
  if (filters.hasDeadline !== undefined && filters.hasDeadline === true) {
    queryParams.append("hasDeadline", filters.hasDeadline.toString());
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
      const response = await fetch(
        `${API_BASE_URL}/api/v1/bounties?${queryParams.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch bounties");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for fetching bounties skills with counts (unauthenticated, cached)
export function useBountiesSkills() {
  return useQuery({
    queryKey: bountyQueryKeys.skills(),
    queryFn: async (): Promise<BountySkillCount[]> => {
      const res = await fetch(`${API_BASE_URL}/api/v1/bounties/skills`);
      if (!res.ok) {
        throw new Error("Failed to fetch bounty skills");
      }
      const json = await res.json();
      // API returns { data: { skill, count }[] }
      return json?.data ?? [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Export types for use in components
export type { Bounty, BountiesResponse, BountiesFilters, BountySkillCount };
