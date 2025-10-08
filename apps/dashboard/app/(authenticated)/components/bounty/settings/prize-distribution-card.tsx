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
import { Label } from '@packages/base/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@packages/base/components/ui/select';
import { Award, Plus, Trash2 } from 'lucide-react';
import type { BountyDetails } from '@/hooks/use-bounty';

interface PrizeDistributionCardProps {
  formData: Partial<BountyDetails>;
  updateFormData: <K extends keyof BountyDetails>(
    field: K,
    value: BountyDetails[K]
  ) => void;
  updateWinnings: (position: string, amount: number) => void;
}

export function PrizeDistributionCard({
  formData,
  updateFormData,
  updateWinnings,
}: PrizeDistributionCardProps) {

  return (
    <>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-white">
          <Award className="size-4" />
          Prize Distribution
        </CardTitle>
        <CardDescription className="text-white/60">
          Set the total amount and how it's distributed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-white/80">
              Total Amount *
            </Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => updateFormData('amount', Number(e.target.value))}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="token" className="text-white/80">
              Token
            </Label>
            <Select
              value={formData.token}
              onValueChange={(value) => updateFormData('token', value)}
            >
              <SelectTrigger className="border-white/10 bg-white/5 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-900">
                <SelectItem value="DOT" className="text-white">
                  DOT
                </SelectItem>
                <SelectItem value="USDT" className="text-white">
                  USDT
                </SelectItem>
                <SelectItem value="USDC" className="text-white">
                  USDC
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white/80">Distribution Type</Label>
          <Select
            value={formData.split}
            onValueChange={(value: string) => updateFormData('split', value)}
          >
            <SelectTrigger className="border-white/10 bg-white/5 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-900">
              <SelectItem value="FIXED" className="text-white">
                Fixed Amounts
              </SelectItem>
              <SelectItem value="EQUAL_SPLIT" className="text-white">
                Equal Split
              </SelectItem>
              <SelectItem value="VARIABLE" className="text-white">
                Variable
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.split === 'FIXED' && (
          <div className="space-y-4">
            <Label className="text-white/80">Winner Prizes *</Label>
            <div className="space-y-2">
              {(formData.winnings && Object.keys(formData.winnings).length > 0
                ? Object.keys(formData.winnings)
                : ['1']
              )
                .sort((a, b) => Number(a) - Number(b))
                .map((position) => (
                  <div key={position} className="flex items-center gap-2">
                    <span className="w-16 text-sm text-white/60">
                      {position}
                      {position === '1'
                        ? 'st'
                        : position === '2'
                        ? 'nd'
                        : position === '3'
                        ? 'rd'
                        : 'th'}{' '}
                      Place
                    </span>
                    <Input
                      type="number"
                      value={
                        formData.winnings && formData.winnings[position] !== undefined
                          ? formData.winnings[position]
                          : ''
                      }
                      onChange={(e) =>
                        updateWinnings(position, Number(e.target.value))
                      }
                      className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
                      placeholder="0"
                    />
                    <span className="text-sm text-white/60">
                      {formData.token}
                    </span>
                    {formData.winnings && Object.keys(formData.winnings).length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-2 text-white/40 hover:text-white"
                        onClick={() => {
                          if (!formData.winnings){ return;}
                          const newWinnings = { ...formData.winnings };
                          delete newWinnings[position];
                          updateFormData('winnings', newWinnings);
                        }}
                        aria-label="Remove tier"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 border-white/20 bg-white/10 text-white hover:bg-white/20"
                onClick={() => {
                  const winnings = formData.winnings ?? {};
                  const existing = Object.keys(winnings).map(Number);
                  let next = 1;
                  while (existing.includes(next)) {
                    next++;
                  }
                  const newWinnings = {
                    ...winnings,
                    [next]: '',
                  };
                  updateFormData('winnings', newWinnings);
                }}
              >
                <Plus className="size-4" />
                Add Winning Tier
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </>
  );
}
