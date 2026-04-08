import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";

interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ClaimListItem {
  id: string;
  method: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  reviewNotes: string | null;
  ecosystemProfile: {
    id: string;
    displayName: string;
    slug: string;
    email: string | null;
    github: string | null;
  };
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

export function useAdminClaims(params: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery<{ data: ClaimListItem[]; pagination: PaginationResponse }>({
    queryKey: ["admin", "claims", params],
    queryFn: () =>
      adminFetch("/claims", {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          status: params.status,
        },
      }),
  });
}

export function useAdminClaim(id: string) {
  return useQuery({
    queryKey: ["admin", "claims", id],
    queryFn: () => adminFetch(`/claims/${id}`),
    enabled: !!id,
  });
}

export function useUpdateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { status: string; reviewNotes?: string };
    }) =>
      adminFetch(`/claims/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}
