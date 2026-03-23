import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";

interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UserListItem {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  banned: boolean;
  profileCompleted: boolean;
  lastSeen: string | null;
  createdAt: string;
  username: string | null;
}

interface UserDetail extends UserListItem {
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  skills: string[];
  walletAddress: string | null;
  twitter: string | null;
  github: string | null;
  linkedin: string | null;
  banReason: string | null;
  members: Array<{
    id: string;
    role: string;
    organization: {
      id: string;
      name: string;
      slug: string;
      logo: string | null;
    };
  }>;
  applications: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    grant: { id: string; title: string };
  }>;
  submissions: Array<{
    id: string;
    title: string | null;
    status: string;
    isWinner: boolean | null;
    createdAt: string;
    bounty: { id: string; title: string };
  }>;
}

export function useAdminUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}) {
  return useQuery<{ data: UserListItem[]; pagination: PaginationResponse }>({
    queryKey: ["admin", "users", params],
    queryFn: () =>
      adminFetch("/users", {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          search: params.search,
          role: params.role,
          status: params.status,
        },
      }),
  });
}

export function useAdminUser(id: string) {
  return useQuery<{ data: UserDetail }>({
    queryKey: ["admin", "users", id],
    queryFn: () => adminFetch(`/users/${id}`),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { role?: string; banned?: boolean; banReason?: string };
    }) =>
      adminFetch(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
