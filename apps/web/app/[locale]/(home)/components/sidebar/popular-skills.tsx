"use client";

import React from "react";
import { Badge } from "@packages/base/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@packages/base/components/ui/card";

interface PopularSkillsProps {
  skills: Array<{ skill: string; count: number }>;
  selectedSkills: string[];
  onSkillToggle: (skill: string) => void;
  loading?: boolean;
}

export function PopularSkills({
  skills,
  selectedSkills,
  onSkillToggle,
  loading = false,
}: PopularSkillsProps) {
  if (loading) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Popular Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-6 w-16 bg-white/10 rounded animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Popular Skills</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {skills.map(({ skill, count }) => {
            const isSelected = selectedSkills.includes(skill);

            return (
              <Badge
                key={skill}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
                    : "border-white/20 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                }`}
                onClick={() => onSkillToggle(skill)}
                title={`${count} opportunities`}
              >
                {skill}
              </Badge>
            );
          })}
        </div>

        {selectedSkills.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-white/50">
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
