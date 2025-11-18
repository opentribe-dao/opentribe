"use client";

import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DangerZoneCardProps {
  onDelete: () => void;
  showDeleteConfirm: boolean;
  onToggleDeleteConfirm: () => void;
}

export function DangerZoneCard({
  onDelete,
  showDeleteConfirm,
  onToggleDeleteConfirm,
}: DangerZoneCardProps) {
  return (
    <Card className="border-red-500/30 bg-red-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-red-400">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription className="text-red-400/60">
          Please be careful when using the Danger Zone.
        </CardDescription>
      </CardHeader>
      {/* <CardHeader>
        <CardTitle className='flex items-center gap-2 font-heading text-red-400'>
          Delete Bounty
        </CardTitle>
        <CardDescription className="text-red-400/60">
          This will permanently delete the bounty and all associated data.
          This action cannot be undone.
        </CardDescription>
      </CardHeader> */}
      <CardContent>
        <div className="space-y-4">
          <div>
            {/* <h4 className="text-red-400 font-small">Delete Bounty</h4> */}
            <Label className="text-white/80">Delete Bounty</Label>
            <CardDescription className="mb-3 text-white/60">
              This will permanently delete the bounty and all associated data.
              This action cannot be undone.
            </CardDescription>
            {showDeleteConfirm ? (
              <div className="space-y-2">
                <p className="text-red-400/80 text-sm">
                  Are you sure? Type "DELETE" to confirm, and then press ENTER.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    className="border-red-500/50 bg-white/5 text-white placeholder:text-white/40"
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        e.currentTarget.value === "DELETE"
                      ) {
                        onDelete();
                      }
                    }}
                    placeholder="Type DELETE to confirm"
                  />
                  <Button
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={onToggleDeleteConfirm}
                    size="sm"
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={onToggleDeleteConfirm}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Delete Bounty
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
