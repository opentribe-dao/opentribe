import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";

interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BountyListItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  amount: string | null;
  token: string;
  submissionCount: number;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  _count: {
    submissions: number;
  };
}

export function useAdminBounties(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  visibility?: string;
}) {
  return useQuery<{ data: BountyListItem[]; pagination: PaginationResponse }>({
    queryKey: ["admin", "bounties", params],
    queryFn: () =>
      adminFetch("/bounties", {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          search: params.search,
          status: params.status,
          visibility: params.visibility,
        },
      }),
  });
}

export function useAdminBounty(id: string) {
  return useQuery({
    queryKey: ["admin", "bounties", id],
    queryFn: () => adminFetch(`/bounties/${id}`),
    enabled: !!id,
  });
}

export function useUpdateBounty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminFetch(`/bounties/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "bounties"] });
    },
  });
}
