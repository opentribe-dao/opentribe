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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import { Award, Plus, Trash2 } from "lucide-react";
import type { BountyDetails } from "@/hooks/use-bounty";

interface PrizeDistributionCardProps {
  formData: Partial<BountyDetails>;
  updateFormData: <K extends keyof BountyDetails>(
    field: K,
    value: BountyDetails[K]
  ) => void;
  updateWinnings: (position: string, amount: number) => void;
  isLocked?: boolean;
}

export function PrizeDistributionCard({
  formData,
  updateFormData,
  updateWinnings,
  isLocked = false,
}: PrizeDistributionCardProps) {
  return (
    <Card className="border-white/10 bg-white/10 backdrop-blur-[10px]">
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
            <Label className="text-white/80" htmlFor="amount">
              Total Amount *
            </Label>
            <Input
              className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${isLocked ? "cursor-not-allowed opacity-60" : ""}`}
              disabled={isLocked}
              id="amount"
              onChange={(e) => updateFormData("amount", Number(e.target.value))}
              placeholder="0"
              type="number"
              value={formData.amount}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80" htmlFor="token">
              Token
            </Label>
            <Select
              disabled={isLocked}
              onValueChange={(value) => updateFormData("token", value)}
              value={formData.token}
            >
              <SelectTrigger className={`border-white/10 bg-white/5 text-white ${isLocked ? "cursor-not-allowed opacity-60" : ""}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-zinc-900">
                <SelectItem className="text-white" value="DOT">
                  DOT
                </SelectItem>
                <SelectItem className="text-white" value="USDT">
                  USDT
                </SelectItem>
                <SelectItem className="text-white" value="USDC">
                  USDC
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-white/80">Distribution Type</Label>
          <Select
            disabled={isLocked}
            onValueChange={(value: string) => updateFormData("split", value)}
            value={formData.split}
          >
            <SelectTrigger className={`border-white/10 bg-white/5 text-white ${isLocked ? "cursor-not-allowed opacity-60" : ""}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-900">
              <SelectItem className="text-white" value="FIXED">
                Fixed Amounts
              </SelectItem>
              <SelectItem className="text-white" value="EQUAL_SPLIT">
                Equal Split
              </SelectItem>
              <SelectItem className="text-white" value="VARIABLE">
                Variable
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.split === "FIXED" && (
          <div className="space-y-4">
            <Label className="text-white/80">Winner Prizes *</Label>
            <div className="space-y-2">
              {(formData.winnings && Object.keys(formData.winnings).length > 0
                ? Object.keys(formData.winnings)
                : ["1"]
              )
                .sort((a, b) => Number(a) - Number(b))
                .map((position) => (
                  <div className="flex items-center gap-2" key={position}>
                    <span className="w-16 text-sm text-white/60">
                      {position}
                      {position === "1"
                        ? "st"
                        : position === "2"
                          ? "nd"
                          : position === "3"
                            ? "rd"
                            : "th"}{" "}
                      Place
                    </span>
                    <Input
                      className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${isLocked ? "cursor-not-allowed opacity-60" : ""}`}
                      disabled={isLocked}
                      onChange={(e) =>
                        updateWinnings(position, Number(e.target.value))
                      }
                      placeholder="0"
                      type="number"
                      value={
                        formData.winnings &&
                        formData.winnings[position] !== undefined
                          ? formData.winnings[position]
                          : ""
                      }
                    />
                    <span className="text-sm text-white/60">
                      {formData.token}
                    </span>
                    {!isLocked &&
                      formData.winnings &&
                      Object.keys(formData.winnings).length > 1 && (
                        <Button
                          aria-label="Remove tier"
                          className="ml-2 text-white/40 hover:text-white"
                          onClick={() => {
                            if (!formData.winnings) {
                              return;
                            }
                            const newWinnings = { ...formData.winnings };
                            delete newWinnings[position];
                            updateFormData("winnings", newWinnings);
                          }}
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                  </div>
                ))}
              {!isLocked && (
                <Button
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
                      [next]: "",
                    };
                    updateFormData("winnings", newWinnings);
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Plus className="size-4" />
                  Add Winning Tier
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
