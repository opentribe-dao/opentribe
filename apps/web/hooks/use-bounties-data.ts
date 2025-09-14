"use client";

import { useQuery } from '@tanstack/react-query';
import { bountyQueryKeys } from './react-query';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

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
  
  if (filters.status?.length) {
    queryParams.append('status', filters.status.join(','));
  }
  if (filters.skills?.length) {
    queryParams.append('skills', filters.skills.join(','));
  }
  if (filters.sortBy) {
    queryParams.append('sortBy', filters.sortBy);
  }
  if (filters.priceRange) {
    queryParams.append('minPrice', filters.priceRange[0].toString());
    queryParams.append('maxPrice', filters.priceRange[1].toString());
  }
  if (filters.hasSubmissions !== undefined) {
    queryParams.append('hasSubmissions', filters.hasSubmissions.toString());
  }
  if (filters.hasDeadline !== undefined) {
    queryParams.append('hasDeadline', filters.hasDeadline.toString());
  }
  if (filters.search) {
    queryParams.append('search', filters.search);
  }
  if (filters.page) {
    queryParams.append('page', filters.page.toString());
  }
  if (filters.limit) {
    queryParams.append('limit', filters.limit.toString());
  }

  return useQuery({
    queryKey: bountyQueryKeys.list(filters),
    queryFn: async (): Promise<BountiesResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/v1/bounties?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch bounties');
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
        throw new Error('Failed to fetch bounty skills');
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
