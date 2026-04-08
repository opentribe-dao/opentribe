import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api";

interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProfileListItem {
  id: string;
  displayName: string;
  slug: string;
  email: string | null;
  github: string | null;
  source: string;
  contactable: boolean;
  claimedByUserId: string | null;
  createdAt: string;
  claimedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count: {
    contributions: number;
    claimRequests: number;
  };
}

export function useAdminProfiles(params: {
  page?: number;
  limit?: number;
  search?: string;
  source?: string;
  claimed?: string;
  contactable?: string;
}) {
  return useQuery<{ data: ProfileListItem[]; pagination: PaginationResponse }>({
    queryKey: ["admin", "profiles", params],
    queryFn: () =>
      adminFetch("/ecosystem-profiles", {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          search: params.search,
          source: params.source,
          claimed: params.claimed,
          contactable: params.contactable,
        },
      }),
  });
}

export function useAdminProfile(id: string) {
  return useQuery({
    queryKey: ["admin", "profiles", id],
    queryFn: () => adminFetch(`/ecosystem-profiles/${id}`),
    enabled: !!id,
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      adminFetch("/ecosystem-profiles", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminFetch(`/ecosystem-profiles/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/ecosystem-profiles/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
    },
  });
}

export function useMergeProfiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      targetId,
      sourceProfileId,
    }: {
      targetId: string;
      sourceProfileId: string;
    }) =>
      adminFetch(`/ecosystem-profiles/${targetId}/merge`, {
        method: "POST",
        body: JSON.stringify({ sourceProfileId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
    },
  });
}

export function useLinkProfileToUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, userId }: { profileId: string; userId: string }) =>
      adminFetch(`/ecosystem-profiles/${profileId}/link`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
    },
  });
}
