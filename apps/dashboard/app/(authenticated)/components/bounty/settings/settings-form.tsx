"use client";

import type { BountyDetails } from "@/hooks/use-bounty";
import { CuratorsCard } from "./curators-card";
import { DangerZoneCard } from "./danzer-zone-card";
import { PrizeDistributionCard } from "./prize-distribution-card";
import { StatusVisibilityCard } from "./status-visibility-card";
import { TimelineCard } from "./timeline-card";

interface BountySettingsFormProps {
  formData: Partial<BountyDetails>;
  bounty: BountyDetails;
  updateFormData: <K extends keyof BountyDetails>(
    field: K,
    value: BountyDetails[K]
  ) => void;
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
  // Lock financial fields if bounty is COMPLETED or CLOSED
  const isFinancialLocked =
    bounty.status === "COMPLETED" || bounty.status === "CLOSED";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left Column - Basic Settings */}
      <div className="space-y-6">
        <PrizeDistributionCard
          formData={formData}
          isLocked={isFinancialLocked}
          updateFormData={updateFormData}
          updateWinnings={updateWinnings}
        />
        <TimelineCard
          formData={formData}
          isLocked={isFinancialLocked}
          updateFormData={updateFormData}
        />
      </div>

      {/* Right Column - Advanced Settings */}
      <div className="space-y-6">
        <StatusVisibilityCard
          bounty={bounty}
          formData={formData}
          updateFormData={updateFormData}
        />
        <CuratorsCard bounty={bounty} />
        <DangerZoneCard
          onDelete={onDelete}
          onToggleDeleteConfirm={onToggleDeleteConfirm}
          showDeleteConfirm={showDeleteConfirm}
        />
      </div>
    </div>
  );
}
