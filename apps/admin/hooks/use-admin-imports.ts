import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";

interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ImportListItem {
  id: string;
  source: string;
  status: string;
  totalItems: number;
  processed: number;
  errors: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export function useAdminImports(params: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return useQuery<{ data: ImportListItem[]; pagination: PaginationResponse }>({
    queryKey: ["admin", "imports", params],
    queryFn: () =>
      adminFetch("/imports", {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          status: params.status,
        },
      }),
  });
}

export function useAdminImport(id: string) {
  return useQuery({
    queryKey: ["admin", "imports", id],
    queryFn: () => adminFetch(`/imports/${id}`),
    enabled: !!id,
  });
}
