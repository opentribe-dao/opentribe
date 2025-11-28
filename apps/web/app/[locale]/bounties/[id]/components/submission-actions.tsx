"use client";

import { useSession } from "@packages/auth/client";
import { Button } from "@packages/base/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteConfirmationDialog } from "../../../components/delete-confirmation-dialog";
import { useDeleteSubmission } from "@/hooks/use-submission-mutations";

type SubmissionActionsProps = {
  bountyId: string;
  submissionId: string;
  submitterId: string;
  className?: string;
  layout?: "row" | "column";
  isBountyComplete?: boolean;
  isDeadlineDue?: boolean;
};

export function SubmissionActions({
  bountyId,
  submissionId,
  submitterId,
  className = "",
  layout = "row",
  isBountyComplete = false,
  isDeadlineDue = false,
}: SubmissionActionsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteSubmission = useDeleteSubmission(bountyId);

  // Only show actions if user owns this submission
  const isOwner = session?.user?.id === submitterId;

  if (!isOwner || isBountyComplete || isDeadlineDue) {
    return null;
  }

  const handleEdit = () => {
    router.push(`/bounties/${bountyId}/submit?edit=${submissionId}`);
  };

  const handleDelete = async () => {
    try {
      await deleteSubmission.mutateAsync();
      setShowDeleteDialog(false);
      // Redirect to bounty page after successful delete
      router.push(`/bounties/${bountyId}`);
    } catch (error) {
      // Error is already handled in the mutation
      console.error("Delete failed:", error);
    }
  };

  const containerClasses =
    layout === "column" ? "flex flex-col gap-3" : "flex flex-wrap gap-2";

  const buttonClasses =
    layout === "column"
      ? "w-full border-white/20 text-white hover:bg-white/10"
      : "border-white/20 text-white hover:bg-white/10";

  const deleteButtonClasses =
    layout === "column"
      ? "w-full border-red-500/40 text-red-400 hover:bg-red-500/10"
      : "border-red-500/40 text-red-400 hover:bg-red-500/10";

  return (
    <>
      <div className={`${containerClasses} ${className}`.trim()}>
        <Button
          className={buttonClasses}
          onClick={handleEdit}
          variant="outline"
        >
          Edit Submission
        </Button>
        <Button
          className={deleteButtonClasses}
          onClick={() => setShowDeleteDialog(true)}
          variant="outline"
        >
          Delete Submission
        </Button>
      </div>

      <DeleteConfirmationDialog
        cancelText="Cancel"
        confirmText="Delete Submission"
        description="Are you sure you want to delete this submission? This action cannot be undone."
        isDeleting={deleteSubmission.isPending}
        onConfirm={handleDelete}
        onOpenChange={setShowDeleteDialog}
        open={showDeleteDialog}
        title="Delete Submission"
        warningMessage="Your submission and any associated comments will be permanently removed."
      />
    </>
  );
}
