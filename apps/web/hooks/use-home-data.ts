import { useQueries, useQuery } from "@tanstack/react-query";
import { env } from "@/env";
import { CACHE_CONFIG, HOMEPAGE_QUERIES } from "@/hooks/react-query";

// Types for homepage data
export interface HomepageStatsResponse {
  platformStats: {
    totalOpportunities: number;
    totalBuilders: number;
    totalRewards: string;
    activeBounties: number;
    activeGrants: number;
  };
  featuredOrganizations: Array<{
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    totalOpportunities: number;
    totalValue: number;
  }>;
  popularSkills: Array<{
    skill: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: "submission" | "application";
    user: {
      firstName?: string | null;
      lastName?: string | null;
      username: string;
      image?: string | null;
    };
    target: {
      id: string;
      title: string;
      type: "bounty" | "grant";
      organizationName: string;
    };
    createdAt: string;
  }>;
}

// API functions
async function fetchHomepageStats(): Promise<HomepageStatsResponse> {
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/api/v1/home/stats`);
  if (!response.ok) {
    throw new Error("Failed to fetch homepage stats");
  }
  const json = await response.json();
  return json.data as HomepageStatsResponse;
}

async function fetchBounties(skills?: string) {
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  const params = new URLSearchParams({ limit: "6" });
  if (skills && skills.length > 0) {
    params.set("skills", skills);
  }

  const response = await fetch(`${apiUrl}/api/v1/bounties?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch bounties");
  }
  return response.json();
}

async function fetchGrants(skills?: string) {
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  const params = new URLSearchParams({ limit: "6" });
  if (skills && skills.length > 0) {
    params.set("skills", skills);
  }

  const response = await fetch(`${apiUrl}/api/v1/grants?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch grants");
  }
  return response.json();
}

async function fetchRFPs() {
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/api/v1/rfps?limit=4`);
  if (!response.ok) {
    throw new Error("Failed to fetch RFPs");
  }
  return response.json();
}

// Hooks
export function useHomepageStats() {
  return useQuery({
    queryKey: [HOMEPAGE_QUERIES.stats],
    queryFn: fetchHomepageStats,
    staleTime: CACHE_CONFIG.stats,
    gcTime: CACHE_CONFIG.stats * 2,
    refetchOnWindowFocus: false,
  });
}

export function useHomepageContent(selectedSkills: string[]) {
  const skillsParam = selectedSkills.join(",");

  return useQueries({
    queries: [
      {
        queryKey: [HOMEPAGE_QUERIES.bounties, skillsParam],
        queryFn: () => fetchBounties(skillsParam),
        staleTime: CACHE_CONFIG.content,
        gcTime: CACHE_CONFIG.content * 2,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: [HOMEPAGE_QUERIES.grants, skillsParam],
        queryFn: () => fetchGrants(skillsParam),
        staleTime: CACHE_CONFIG.content,
        gcTime: CACHE_CONFIG.content * 2,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: [HOMEPAGE_QUERIES.rfps],
        queryFn: () => fetchRFPs(),
        staleTime: CACHE_CONFIG.content,
        gcTime: CACHE_CONFIG.content * 2,
        refetchOnWindowFocus: false,
      },
    ],
  });
}
