'use client';

import { useBountySettings } from '@/hooks/use-bounty';
import { useBountyContext } from '../../../components/bounty-provider';
import { BountySettingsHeader } from '@/app/(authenticated)/components/bounty/settings/settings-header';
import { BountySettingsForm } from '@/app/(authenticated)/components/bounty/settings/settings-form';

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
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className="text-white/60">Loading bounty settings...</div>
      </div>
    );
  }

  if (bountyError || !bounty) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className="text-red-400">Failed to load bounty settings</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BountySettingsHeader
        hasChanges={hasChanges}
        isSaving={isSaving}
        isResetting={isResetting}
        onSave={handleSave}
        onReset={handleReset}
      />
      
      <BountySettingsForm
        formData={formData}
        bounty={bounty}
        updateFormData={updateFormData}
        updateWinnings={updateWinnings}
        onDelete={handleDelete}
        showDeleteConfirm={showDeleteConfirm}
        onToggleDeleteConfirm={() => setShowDeleteConfirm(!showDeleteConfirm)}
      />
    </div>
  );
}