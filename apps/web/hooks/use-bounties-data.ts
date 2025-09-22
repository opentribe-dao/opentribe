"use client";

import { useQuery } from '@tanstack/react-query';
import { bountyQueryKeys } from './react-query';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

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
  amount: string; // API returns as string
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

// Hook for fetching bounties data with filters
export function useBountiesData(filters: BountiesFilters = {}) {
  const queryParams = new URLSearchParams();
  
  // search
  if (filters.search !== undefined && filters.search !== '') {
    queryParams.append('search', filters.search);
  }
  
  // status
  if (filters.status !== undefined && Array.isArray(filters.status)) {
    const statusValues = filters.status
      .map((s) => (s ?? '').toString().trim())
      .filter((s) => s !== '');
    if (statusValues.length > 0) {
      queryParams.append('status', statusValues.join(',').toLowerCase());
    }
  }
  // skills
  if (filters.skills !== undefined && Array.isArray(filters.skills)) {
    const skillsValues = filters.skills
      .map((s) => (s ?? '').toString().trim())
      .filter((s) => s !== '');
    if (skillsValues.length > 0) {
      queryParams.append('skills', skillsValues.join(','));
    }
  }
  // sortBy
  if (filters.sortBy !== undefined && filters.sortBy !== '') {
    queryParams.append('sort', filters.sortBy);
  }
  // priceRange
  if (
    filters.priceRange !== undefined && 
    filters.priceRange &&
    Array.isArray(filters.priceRange) &&
    filters.priceRange.length === 2 &&
    !(filters.priceRange[0] === 0 && filters.priceRange[1] === 50000)
  ) {
    queryParams.append('minAmount', filters.priceRange[0].toString());
    queryParams.append('maxAmount', filters.priceRange[1].toString());
  }
  // hasSubmissions
  if (filters.hasSubmissions !== undefined && filters.hasSubmissions === true) {
    queryParams.append('hasSubmissions', 'true');
  }
  // hasDeadline
  if (filters.hasDeadline !== undefined && filters.hasDeadline === true) {
    queryParams.append('hasDeadline', 'true');
  }
  // pagination
  if (filters.page) {
    queryParams.append('page', filters.page.toString());
  }
  // limit
  if (filters.limit) {
    queryParams.append('limit', filters.limit.toString());
  }

  return useQuery({
    queryKey: bountyQueryKeys.list(filters),
    queryFn: async (): Promise<BountiesResponse> => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/bounties?${queryParams.toString()}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Bounties API endpoint not found');
          } else if (response.status >= 500) {
            throw new Error('Server error. Please try again later.');
          } else if (response.status === 429) {
            throw new Error('Too many requests. Please wait a moment and try again.');
          } else {
            throw new Error(`Failed to fetch bounties (${response.status})`);
          }
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format from server');
        }
        
        return data;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Network error. Please check your connection and try again.');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
}

// Hook for fetching bounties skills with counts (unauthenticated, cached)
export function useBountiesSkills() {
  return useQuery({
    queryKey: bountyQueryKeys.skills(),
    queryFn: async (): Promise<BountySkillCount[]> => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/bounties/skills`);
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Skills API endpoint not found');
          } else if (res.status >= 500) {
            throw new Error('Server error while fetching skills');
          } else {
            throw new Error(`Failed to fetch bounty skills (${res.status})`);
          }
        }
        
        const json = await res.json();
        
        // Validate response structure
        if (!json || typeof json !== 'object') {
          throw new Error('Invalid skills response format');
        }
        
        // API returns { data: { skill, count }[] }
        const skills = json?.data ?? [];
        
        // Validate skills array structure
        if (!Array.isArray(skills)) {
          console.warn('Skills API returned non-array data, using empty array');
          return [];
        }
        
        return skills;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Network error while fetching skills');
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
}

// Export types for use in components
export type { Bounty, BountiesResponse, BountiesFilters, BountySkillCount };
