"use client";

import { BountySettingsForm } from "@/app/(authenticated)/components/bounty/settings/settings-form";
import { BountySettingsHeader } from "@/app/(authenticated)/components/bounty/settings/settings-header";
import { useBountySettings } from "@/hooks/use-manage-bounty";
import { useBountyContext } from "../../../components/bounty-provider";

export default function SettingsPage() {
  const { bounty, bountyLoading, bountyPending, bountyError } =
    useBountyContext();
  const {
    formData,
    hasChanges,
    isSaving,
    isResetting,
    updateFormData,
    updateWinnings,
    handleSave,
    handleReset,
    handleDelete,
    showDeleteConfirm,
    setShowDeleteConfirm,
  } = useBountySettings(bounty);

  // Show loader if loading or pending (query might be disabled waiting for activeOrg)
  if (bountyLoading || bountyPending) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-white/60">Loading bounty settings...</div>
      </div>
    );
  }

  // Only show error if we're not loading/pending AND we have an error or no bounty
  const isLoadingOrPending = bountyLoading || bountyPending;
  if (!isLoadingOrPending && (bountyError || !bounty)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-red-400">Failed to load bounty settings</div>
      </div>
    );
  }

  // At this point, bounty must be defined (we've checked for loading/error states)
  if (!bounty) {
    return null;
  }

  return (
    <div className="space-y-6">
      <BountySettingsHeader
        hasChanges={hasChanges}
        isResetting={isResetting}
        isSaving={isSaving}
        onReset={handleReset}
        onSave={handleSave}
      />

      <BountySettingsForm
        bounty={bounty}
        formData={formData}
        onDelete={handleDelete}
        onToggleDeleteConfirm={() => setShowDeleteConfirm(!showDeleteConfirm)}
        showDeleteConfirm={showDeleteConfirm}
        updateFormData={updateFormData}
        updateWinnings={updateWinnings}
      />
    </div>
  );
}
