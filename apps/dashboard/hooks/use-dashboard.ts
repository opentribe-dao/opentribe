import { handleError } from "@packages/base/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { env } from "@/env";

export interface DashboardResponse {
  stats: {
    activeBounties: number;
    activeGrants: number;
    pendingSubmissions: number;
    pendingApplications: number;
    totalAwarded: number;
    totalMembers: number;
    monthlyGrowth: {
      submissions: number; // percentage
      applications: number; // percentage
    };
  };

  urgentActions: Array<{
    id: string;
    type:
      | "REVIEW_SUBMISSIONS"
      | "REVIEW_APPLICATIONS"
      | "DEADLINE_APPROACHING"
      | "WINNER_ANNOUNCEMENT";
    title: string;
    description: string;
    count?: number;
    deadline?: Date;
    resourceId: string;
    resourceType: "bounty" | "grant";
    actionUrl: string;
    priority: "high" | "medium" | "low";
  }>;

  recentActivity: Array<{
    id: string;
    type: "NEW_SUBMISSION" | "NEW_APPLICATION" | "COMMENT" | "MEMBER_JOINED";
    actorName: string;
    actorAvatar?: string;
    action: string;
    resourceTitle: string;
    resourceUrl: string;
    timestamp: Date;
    isNew: boolean;
  }>;

  upcomingDeadlines: Array<{
    id: string;
    title: string;
    type: "bounty" | "grant";
    deadline: Date;
    url: string;
  }>;
}

export function useDashboard(organizationId?: string) {
  return useQuery<DashboardResponse, Error>({
    queryKey: ["dashboard", organizationId],
    queryFn: async () => {
      if (!organizationId) {
        return Promise.reject(new Error("No organization ID"));
      }
      const res = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${organizationId}/dashboard`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) {
        handleError(new Error(`${res.statusText}`));
        throw new Error(`Failed to fetch dashboard: ${res.statusText}`);
      }
      const data = await res.json();
      return data.data;
    },
    enabled: !!organizationId,
    refetchInterval: 30_000, // 30 seconds
    retry: 2, // retry twice on error
  });
}
