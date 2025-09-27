import { env } from "@/env";
import { useQuery } from "@tanstack/react-query";
import { use } from "react";


export type GrantStatus = 'OPEN' | 'PAUSED' | 'CLOSED';
export type GrantVisibilityStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type GrantSource = 'NATIVE' | 'EXTERNAL';

export interface GrantOrganization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  location?: string | null;
  industry?: string[];
}

export interface GrantCuratorUser {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  avatarUrl?: string | null;
}

export interface GrantCurator {
  id: string;
  user: GrantCuratorUser;
  contact?: string | null;
}

export interface GrantRFP {
  id: string;
  title: string;
  slug: string;
  status: 'OPEN' | 'PAUSED' | 'CLOSED';
  _count: {
    votes: number;
    comments: number;
    applications: number;
  };
}

export interface GrantApplicationApplicant {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

export interface GrantApplication {
  id: string;
  title: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  budget?: number | null;
  submittedAt?: string | null;
  applicant: GrantApplicationApplicant;
}

export interface Grant {
  id: string;
  title: string;
  slug: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  description: string;
  summary?: string | null;
  instructions?: string | null;
  resources?: Array<{ title: string; url: string; description?: string }>;
  screening?: Array<{ title: string; url: string; description?: string }>;
  applicationUrl?: string | null;
  token?: string | null;
  skills: string[];
  minAmount?: number | null;
  maxAmount?: number | null;
  totalFunds?: number | null;
  status: GrantStatus;
  visibility?: GrantVisibilityStatus | null;
  source: GrantSource;
  createdAt: string;
  publishedAt?: string | null;
  organization: GrantOrganization;
  _count: {
    applications: number;
    rfps: number;
    curators: number;
  };
  curators: GrantCurator[];
  rfps: GrantRFP[];
  applications: GrantApplication[];
}



export function useGrant(grantId: string) {
  return useQuery<Grant, Error>({
    queryKey: ['grant', grantId],
    queryFn: async () => {
      const res = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/grants/${grantId}`,
        {
          credentials: 'include',
        }
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch grant ${grantId}: ${res.statusText}`);
      }
      const data = await res.json();
      return data.grant;
    },
    enabled: !!grantId,
    refetchInterval: 30_000, // 30 seconds
    retry: 2, // retry twice on error
  });
}