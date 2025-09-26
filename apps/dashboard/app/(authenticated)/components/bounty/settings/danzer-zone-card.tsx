'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';
import { Button } from '@packages/base/components/ui/button';
import { Input } from '@packages/base/components/ui/input';
import { Trash2 } from 'lucide-react';

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
        <CardTitle className='flex items-center gap-2 font-heading text-red-400'>
          Delete Bounty
        </CardTitle>
        <CardDescription className="text-red-400/60">
          This will permanently delete the bounty and all associated data.
          This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            {showDeleteConfirm ? (
              <div className="space-y-2">
                <p className="text-red-400/80 text-sm">
                  Are you sure? Type "DELETE" to confirm.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type DELETE to confirm"
                    className="border-red-500/50 bg-white/5 text-white placeholder:text-white/40"
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        e.currentTarget.value === 'DELETE'
                      ) {
                        onDelete();
                      }
                    }}
                  />
                  <Button
                    onClick={onToggleDeleteConfirm}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={onToggleDeleteConfirm}
                variant="destructive"
                size="sm"
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