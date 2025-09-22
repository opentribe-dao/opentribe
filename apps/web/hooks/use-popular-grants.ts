"use client";

import { useQuery } from '@tanstack/react-query';
import { popularGrantsQueryKeys } from './react-query';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface PopularGrant {
  id: string;
  name: string;
  organization: {
    name: string;
    logo?: string;
  };
}

interface PopularGrantsResponse {
  data: PopularGrant[];
}

// Hook for fetching popular grants
export function usePopularGrants() {
  return useQuery({
    queryKey: popularGrantsQueryKeys.list(),
    queryFn: async (): Promise<PopularGrant[]> => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/grants/popular`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Popular grants API endpoint not found');
          }
          if (response.status >= 500) {
            throw new Error('Server error while fetching popular grants');
          }
          throw new Error(`Failed to fetch popular grants (${response.status})`);
        }
        
        const data: PopularGrantsResponse = await response.json();
        
        // Validate response structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid popular grants response format');
        }
        
        // API returns { data: PopularGrant[] }
        const grants = data?.data ?? [];
        
        // Validate grants array structure
        if (!Array.isArray(grants)) {
          return [];
        }
        
        return grants;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Network error while fetching popular grants');
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
export type { PopularGrant, PopularGrantsResponse };
