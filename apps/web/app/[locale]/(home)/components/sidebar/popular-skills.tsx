"use client";

import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Skeleton } from "@packages/base/components/ui/skeleton";
import { getSkillLabel } from "@packages/base/lib/skills";
import React from "react";

interface PopularSkillsProps {
  skills: Array<{ skill: string; count: number }>;
  selectedSkills: string[];
  onSkillToggle: (skill: string) => void;
  loading?: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function PopularSkills({
  skills,
  selectedSkills,
  onSkillToggle,
  loading = false,
  hasActiveFilters,
  onClearFilters,
}: PopularSkillsProps) {
  if (loading) {
    return (
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Popular Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton className="h-6 w-16" key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (skills.length === 0) {
    return null;
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Popular Skills</CardTitle>
          <Button
            className="text-white/60 hover:bg-white/10 hover:text-white"
            disabled={!hasActiveFilters}
            onClick={onClearFilters}
            size="sm"
            style={{ opacity: hasActiveFilters ? 1 : 0 }}
            variant="ghost"
          >
            Clear filters
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {skills.map(({ skill, count }) => {
            const isSelected = selectedSkills.includes(skill);

            return (
              <Badge
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
                    : "border-white/20 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                }`}
                key={skill}
                onClick={() => onSkillToggle(skill)}
                title={`${count} opportunities`}
                variant={isSelected ? "default" : "outline"}
              >
                {getSkillLabel(skill)}
              </Badge>
            );
          })}
        </div>

        {selectedSkills.length > 0 && (
          <div className="mt-3 border-white/10 border-t pt-3">
            <p className="text-white/50 text-xs">
              {selectedSkills.length} skill
              {selectedSkills.length === 1 ? "" : "s"} selected
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default React.memo(PopularSkills);
