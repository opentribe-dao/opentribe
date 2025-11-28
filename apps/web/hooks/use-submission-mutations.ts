import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { env } from "@/env";
import { bountyQueryKeys } from "./react-query";

const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

// Types
interface SubmissionUpdateData {
  submissionUrl?: string;
  title?: string;
  description?: string;
  attachments?: string[];
  responses?: Record<string, any>;
}

interface Submission {
  id: string;
  title: string;
  description: string;
  submissionUrl: string;
  attachments: string[];
  responses: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Fetch current user's submission for a bounty
export function useMySubmission(bountyId: string) {
  return useQuery({
    queryKey: ["bounties", bountyId, "my-submission"],
    queryFn: async (): Promise<Submission | null> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/bounties/${bountyId}/submissions/me`,
          {
            credentials: "include",
          }
        );

        if (response.status === 404) {
          // No submission found for this user
          return null;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch your submission");
        }

        const data = await response.json();
        return data.submission || null;
      } catch (error) {
        console.error("Error fetching user submission:", error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Update submission mutation
export function useUpdateSubmission(bountyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmissionUpdateData) => {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/bounties/${bountyId}/submissions/me`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update submission");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: bountyQueryKeys.detail(bountyId),
      });
      queryClient.invalidateQueries({
        queryKey: ["bounties", bountyId, "my-submission"],
      });

      toast.success("Submission updated successfully!");
    },
    onError: (error: Error) => {
      console.error("Error updating submission:", error);
      toast.error(error.message || "Failed to update submission");
    },
  });
}

// Delete submission mutation
export function useDeleteSubmission(bountyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/bounties/${bountyId}/submissions/me`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete submission");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: bountyQueryKeys.detail(bountyId),
      });
      queryClient.invalidateQueries({
        queryKey: ["bounties", bountyId, "my-submission"],
      });

      toast.success("Submission deleted successfully!");
    },
    onError: (error: Error) => {
      console.error("Error deleting submission:", error);
      toast.error(error.message || "Failed to delete submission");
    },
  });
}

// Export types
export type { SubmissionUpdateData, Submission };
