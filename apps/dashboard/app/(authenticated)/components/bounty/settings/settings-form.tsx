'use client';

import { DangerZoneCard } from './danzer-zone-card';
import { PrizeDistributionCard } from './prize-distribution-card';
import { StatusVisibilityCard } from './status-visibility-card';
import { TimelineCard } from './timeline-card';
import type { BountyDetails } from '@/hooks/use-bounty';

interface BountySettingsFormProps {
  formData: Partial<BountyDetails>;
  bounty: BountyDetails;
  updateFormData: <K extends keyof BountyDetails>(field: K, value: BountyDetails[K]) => void;
  updateWinnings: (position: string, amount: number) => void;
  onDelete: () => void;
  showDeleteConfirm: boolean;
  onToggleDeleteConfirm: () => void;
}

export function BountySettingsForm({
  formData,
  bounty,
  updateFormData,
  updateWinnings,
  onDelete,
  showDeleteConfirm,
  onToggleDeleteConfirm,
}: BountySettingsFormProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left Column - Basic Settings */}
      <div className="space-y-6">
        <PrizeDistributionCard 
          formData={formData} 
          updateFormData={updateFormData}
          updateWinnings={updateWinnings}
        />
        <TimelineCard 
          formData={formData} 
          updateFormData={updateFormData}
        />
      </div>

      {/* Right Column - Advanced Settings */}
      <div className="space-y-6">
        <StatusVisibilityCard 
          formData={formData} 
          bounty={bounty}
          updateFormData={updateFormData}
        />
        <DangerZoneCard
          onDelete={onDelete}
          showDeleteConfirm={showDeleteConfirm}
          onToggleDeleteConfirm={onToggleDeleteConfirm}
        />
      </div>
    </div>
  );
}