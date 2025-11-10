import { useSession } from "@packages/auth/client";
import type { Prisma } from "@packages/db";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { env } from "@/env";

// Define the user profile with organizations using Prisma's type system
export type UserProfileWithOrganizations = Prisma.UserGetPayload<{
  include: {
    members: {
      include: {
        organization: true;
      };
    };
  };
}>;

// Simplified type for API response (what we actually return from the API)
// Note: interests is string[] in Prisma schema, skills and preferences are Json
export type UserProfile = Omit<UserProfileWithOrganizations, "members"> & {
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
};

export interface UserProfileResponse {
  user: UserProfile;
}

// Query key factory for user data
export const userQueryKeys = {
  all: ["users"] as const,
  profile: () => [...userQueryKeys.all, "profile"] as const,
  me: () => [...userQueryKeys.profile(), "me"] as const,
};

// Fetch user profile from API
async function fetchUserProfile(): Promise<UserProfile> {
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${apiUrl}/api/v1/users/me`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to fetch user profile: ${response.statusText}`);
  }

  const data: UserProfileResponse = await response.json();
  return data.user;
}

// Hook to fetch current user profile
export function useUserProfile() {
  const { data: session, isPending: sessionLoading } = useSession();

  return useQuery({
    queryKey: userQueryKeys.me(),
    queryFn: fetchUserProfile,
    enabled: !!session?.user && !sessionLoading,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error instanceof Error && error.message === "Unauthorized") {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// Type for profile update - only include fields that can be updated
export type ProfileUpdateData = Partial<
  Pick<
    UserProfile,
    | "firstName"
    | "lastName"
    | "username"
    | "location"
    | "skills"
    | "walletAddress"
    | "website"
    | "twitter"
    | "github"
    | "linkedin"
    | "employer"
    | "workExperience"
    | "cryptoExperience"
    | "workPreference"
    | "profileCompleted"
    | "bio"
    | "headline"
    | "image"
    | "discord"
    | "telegram"
    | "interests"
  >
>;

// Update user profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const apiUrl = env.NEXT_PUBLIC_API_URL;

  return useMutation({
    mutationFn: async (data: ProfileUpdateData) => {
      const response = await fetch(`${apiUrl}/api/v1/users/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Update the cache with the new data
      queryClient.setQueryData(
        userQueryKeys.me(),
        (old: UserProfile | undefined) => {
          if (!old) return old;
          return {
            ...old,
            ...data,
          };
        }
      );
      // Also invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: userQueryKeys.me() });
    },
  });
}
