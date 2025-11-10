"use client";

import { Button } from "@packages/base/components/ui/button";
import { Loader2, Save, Undo2 } from "lucide-react";

interface BountySettingsHeaderProps {
  hasChanges: boolean;
  isSaving: boolean;
  isResetting: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function BountySettingsHeader({
  hasChanges,
  isSaving,
  isResetting,
  onSave,
  onReset,
}: BountySettingsHeaderProps) {
  if (!hasChanges) {
    return null;
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
        disabled={isSaving}
        onClick={onSave}
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save Changes
      </Button>

      <Button
        className="border-white/20 bg-white/10 text-white hover:bg-white/20"
        disabled={isResetting}
        onClick={onReset}
        variant="outline"
      >
        {isResetting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Undo2 className="h-4 w-4" />
        )}
        Reset
      </Button>
    </div>
  );
}
