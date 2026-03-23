import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";

interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface GrantListItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string | null;
  source: string;
  fundingSource: string;
  totalFunds: string | null;
  applicationCount: number;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  _count: {
    applications: number;
    rfps: number;
  };
}

export function useAdminGrants(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
  visibility?: string;
  fundingSource?: string;
}) {
  return useQuery<{ data: GrantListItem[]; pagination: PaginationResponse }>({
    queryKey: ["admin", "grants", params],
    queryFn: () =>
      adminFetch("/grants", {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          search: params.search,
          status: params.status,
          source: params.source,
          visibility: params.visibility,
          fundingSource: params.fundingSource,
        },
      }),
  });
}

export function useAdminGrant(id: string) {
  return useQuery({
    queryKey: ["admin", "grants", id],
    queryFn: () => adminFetch(`/grants/${id}`),
    enabled: !!id,
  });
}

export function useCreateGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      adminFetch("/grants", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "grants"] });
    },
  });
}

export function useUpdateGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminFetch(`/grants/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "grants"] });
    },
  });
}
