import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { env } from "@/env";
import type { Grant } from "./use-grant";

export function useGrantSettings(grant: Grant | undefined) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const organizationId = grant?.organization?.id;

  // Pause/Resume mutation (toggle status between OPEN and PAUSED)
  const pauseResumeMutation = useMutation({
    mutationFn: async (newStatus: "OPEN" | "PAUSED") => {
      if (!grant || !organizationId) {
        throw new Error("No grant or organization found");
      }

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${organizationId}/grants/${grant.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update grant status");
      }

      return response.json();
    },
    onSuccess: (_, newStatus) => {
      toast.success(
        newStatus === "PAUSED"
          ? "Grant paused successfully!"
          : "Grant resumed successfully!"
      );
      // Invalidate and refetch grant data
      queryClient.invalidateQueries({
        queryKey: ["grant", grant?.id, organizationId],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update grant status"
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!grant || !organizationId) {
        throw new Error("No grant or organization found");
      }

      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/organizations/${organizationId}/grants/${grant.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete grant");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Grant deleted successfully!");
      router.push("/grants");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete grant"
      );
    },
  });

  // Handlers
  const handlePauseResume = useCallback(() => {
    if (!grant) return;

    const newStatus = grant.status === "OPEN" ? "PAUSED" : "OPEN";
    pauseResumeMutation.mutate(newStatus);
  }, [grant, pauseResumeMutation]);

  const handleDelete = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  return {
    handlePauseResume,
    handleDelete,
    isPausingResuming: pauseResumeMutation.isPending,
    isDeleting: deleteMutation.isPending,
    showDeleteConfirm,
    setShowDeleteConfirm,
  };
}
