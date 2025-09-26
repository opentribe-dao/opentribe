'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@packages/base/components/ui/card';
import { Input } from '@packages/base/components/ui/input';
import { Label } from '@packages/base/components/ui/label';
import { Clock } from 'lucide-react';
import type { BountyDetails } from '@/hooks/use-bounty';

interface TimelineCardProps {
  formData: Partial<BountyDetails>;
  updateFormData: <K extends keyof BountyDetails>(field: K, value: BountyDetails[K]) => void;
}

export function TimelineCard({ formData, updateFormData }: TimelineCardProps) {
  return (
    <Card className="border-white/10 bg-white/10 backdrop-blur-[10px]">
      <CardHeader>
        <CardTitle className='flex items-center gap-2 font-heading text-white'>
          <Clock className="size-4" />
          Timeline
        </CardTitle>
        <CardDescription className="text-white/60">
          Set submission deadline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="deadline" className="text-white/80">
            Deadline
          </Label>
          <Input
            id="deadline"
            type="datetime-local"
            value={formData.deadline}
            onChange={(e) => updateFormData('deadline', e.target.value)}
            className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
          />
        </div>
      </CardContent>
    </Card>
  );
}
