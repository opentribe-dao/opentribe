import { QueryClient } from "@tanstack/react-query";
import type { BountiesFilters } from "./use-bounties-data";
import type { GrantsFilters } from "./use-grants-data";
import type { RFPsFilters } from "./use-rfps-data";

// Query keys for homepage data
export const HOMEPAGE_QUERIES = {
  stats: "homepage-stats",
  bounties: "homepage-bounties",
  grants: "homepage-grants",
  rfps: "homepage-rfps",
} as const;

// Query keys for bounties page data
export const BOUNTIES_QUERIES = {
  data: "bounties-data",
  stats: "bounties-stats",
  filterOptions: "bounties-filter-options",
} as const;

// Bounty query keys factory
export const bountyQueryKeys = {
  all: ["bounties"] as const,
  lists: () => [...bountyQueryKeys.all, "list"] as const,
  list: (filters: BountiesFilters) =>
    [...bountyQueryKeys.lists(), filters] as const,
  details: () => [...bountyQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...bountyQueryKeys.details(), id] as const,
  stats: () => [...bountyQueryKeys.all, "stats"] as const,
  filterOptions: () => [...bountyQueryKeys.all, "filter-options"] as const,
  skills: () => [...bountyQueryKeys.all, "skills"] as const,
};

// Grant query keys factory
export const grantQueryKeys = {
  all: ["grants"] as const,
  lists: () => [...grantQueryKeys.all, "list"] as const,
  list: (filters: GrantsFilters) =>
    [...grantQueryKeys.lists(), filters] as const,
  details: () => [...grantQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...grantQueryKeys.details(), id] as const,
  stats: () => [...grantQueryKeys.all, "stats"] as const,
  filterOptions: () => [...grantQueryKeys.all, "filter-options"] as const,
  skills: () => [...grantQueryKeys.all, "skills"] as const,
};

// RFP query keys factory
export const rfpQueryKeys = {
  all: ["rfps"] as const,
  lists: () => [...rfpQueryKeys.all, "list"] as const,
  list: (filters: RFPsFilters) => [...rfpQueryKeys.lists(), filters] as const,
  details: () => [...rfpQueryKeys.all, "detail"] as const,
  detail: (id: string) => [...rfpQueryKeys.details(), id] as const,
  stats: () => [...rfpQueryKeys.all, "stats"] as const,
  filterOptions: () => [...rfpQueryKeys.all, "filter-options"] as const,
};

// Top query keys factory
export const topQueryKeys = {
  rfps: () => ["top", "rfps"] as const,
  bounties: () => ["top", "bounties"] as const,
};

// Cache configuration
export const CACHE_CONFIG = {
  stats: 5 * 60 * 1000, // 5 minutes (stats change slowly)
  content: 2 * 60 * 1000, // 2 minutes (content updates more frequently)
  revalidateOnFocus: false, // Prevent unnecessary refetches
};

// React Query client configuration
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Cache for 10 minutes, stale after 2 minutes
      gcTime: 10 * 60 * 1000,
      staleTime: 2 * 60 * 1000,

      // Retry logic
      retry: (failureCount: number, error: unknown) => {
        if (error instanceof Error) {
          // Don't retry on 4xx errors
          if (error.message.includes("40")) {
            return false;
          }
          // Don't retry on network errors more than once
          if (error.message.includes("fetch") && failureCount >= 1) {
            return false;
          }
        }
        return failureCount < 3;
      },

      // Background updates
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
};

// Create query client with default configuration
export const queryClient = new QueryClient(queryClientConfig);
