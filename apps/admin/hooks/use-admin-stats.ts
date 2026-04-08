import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";

export interface AdminStats {
  totalUsers: number;
  totalOrganizations: number;
  totalGrants: number;
  totalBounties: number;
  totalEcosystemProfiles: number;
  pendingClaims: number;
  totalImportJobs: number;
}

export function useAdminStats() {
  return useQuery<{ data: AdminStats }>({
    queryKey: ["admin", "stats"],
    queryFn: () => adminFetch("/stats"),
    refetchInterval: 30_000,
  });
}
