import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";

interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface OrgListItem {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  orgType: string;
  visibility: string;
  isVerified: boolean;
  managedByPlatform: boolean;
  createdAt: string;
  _count: {
    bounties: number;
    grants: number;
    members: number;
  };
}

export function useAdminOrganizations(params: {
  page?: number;
  limit?: number;
  search?: string;
  orgType?: string;
  visibility?: string;
  managed?: string;
}) {
  return useQuery<{ data: OrgListItem[]; pagination: PaginationResponse }>({
    queryKey: ["admin", "organizations", params],
    queryFn: () =>
      adminFetch("/organizations", {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          search: params.search,
          orgType: params.orgType,
          visibility: params.visibility,
          managed: params.managed,
        },
      }),
  });
}

export function useAdminOrganization(id: string) {
  return useQuery({
    queryKey: ["admin", "organizations", id],
    queryFn: () => adminFetch(`/organizations/${id}`),
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      adminFetch("/organizations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminFetch(`/organizations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
    },
  });
}
