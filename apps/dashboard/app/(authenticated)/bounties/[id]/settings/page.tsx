"use client";

import { BountySettingsForm } from "@/app/(authenticated)/components/bounty/settings/settings-form";
import { BountySettingsHeader } from "@/app/(authenticated)/components/bounty/settings/settings-header";
import { useBountySettings } from "@/hooks/use-manage-bounty";
import { useBountyContext } from "../../../components/bounty-provider";

export default function SettingsPage() {
  const { bounty, bountyLoading, bountyError } = useBountyContext();
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

  if (bountyLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-white/60">Loading bounty settings...</div>
      </div>
    );
  }

  if (bountyError || !bounty) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-red-400">Failed to load bounty settings</div>
      </div>
    );
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
