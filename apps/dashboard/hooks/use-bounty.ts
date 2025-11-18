import { useActiveOrganization } from "@packages/auth/client";
import { useQuery } from "@tanstack/react-query";
import { env } from "@/env";
export type BountyDetails = {
  id: string;
  title: string;
  slug: string;
  description: string;
  skills: string[];
  amount: number;
  token: string;
  split: string;
  winnings: Record<string, number>;
  deadline: string;
  resources?: Array<{ title: string; url: string; description?: string }>;
  screening?: Array<{
    question: string;
    type: "text" | "url" | "file" | "boolean";
    optional: boolean;
  }>;
  status: string;
  visibility: string;
  submissionCount: number;
  organization: {
    id: string;
    name: string;
    logo?: string;
  };
  createdAt: string;
  publishedAt?: string;
  winnersAnnouncedAt?: string;
};

export type Submission = {
  id: string;
  title?: string;
  description?: string;
  submissionUrl?: string;
  responses?: string;
  status: string;
  isWinner: boolean;
  position?: number;
  winningAmount?: string;
  submittedAt?: string;
  submitter: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    image?: string;
    headline?: string;
    walletAddress?: string;
  };
  stats: {
    commentsCount: number;
    likesCount: number;
  };
  payments?: Array<{
    id: string;
    status: string;
    extrinsicHash?: string;
    amount: number;
    createdAt: string;
  }>;
};

export function useBounty(bountyId?: string) {
  const { data: activeOrg } = useActiveOrganization();

  return useQuery<BountyDetails, Error>({
    queryKey: ["bounty", bountyId, activeOrg?.id],
    queryFn: async () => {
      if (!bountyId) {
        return Promise.reject(new Error("No bounty ID"));
      }

      console.log("activeOrgId", activeOrg?.id);
      // Use organization-scoped route via activeOrg
      const res = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${
          activeOrg?.id ?? ""
        }/bounties/${bountyId}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error(
          `Failed to fetch bounty ${bountyId}: ${res.statusText}`
        );
      }

      const data = await res.json();
      return data.bounty;
    },
    enabled: !!bountyId && !!activeOrg?.id,
    refetchInterval: 30_000, // 30 seconds
    retry: 2, // retry twice on error
  });
}

export function useBountySubmissions(bountyId?: string) {
  const { data: activeOrg } = useActiveOrganization();

  return useQuery<Submission[], Error>({
    queryKey: ["bounty-submissions", bountyId, activeOrg?.id],
    queryFn: async () => {
      if (!bountyId) {
        return Promise.reject(new Error("No Bounty ID"));
      }
      const res = await await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bountyId}/submissions`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) {
        throw new Error(
          `Failed to fetch bounty ${bountyId} submissions: ${res.statusText}`
        );
      }
      const data = await res.json();
      return data.submissions || [];
    },
    enabled: !!bountyId && !!activeOrg?.id,
    refetchInterval: 30_000, // 30 seconds
    retry: 2, // retry twice on error
  });
}
