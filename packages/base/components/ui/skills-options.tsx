"use client"

import React from "react"
import { MultiSelect } from "@packages/base/components/ui/multi-select"
import { skillsOptions } from "@packages/base/lib/skills"
import { cn } from "@packages/base/lib/utils"
import { toast } from "sonner"

interface SkillsOptionsProps {
  value?: string[]
  onChange?: (skills: string[]) => void
  className?: string
}

export default function SkillsOptions({ 
  value = [], 
  onChange,
  className 
}: SkillsOptionsProps) {
  // Handle skill selection changes
  const handleSkillsChange = (skills: string[]) => {
    if (skills && skills.length === 0) {
      toast.error("Please select at least one skill");
    }
    onChange?.(skills);
  }

  return (
    <div className={cn("space-y-6 border-white/20 bg-white/5 text-white placeholder:text-white/40", className)}>
      <div>
        <MultiSelect
          options={skillsOptions}
          onValueChange={handleSkillsChange}
          values={value}
          placeholder="Choose your skills..."
          className={cn(
            "w-full", 
            "hover-bg relative overflow-hidden rounded-lg bg-bg-idle backdrop-blur-sm border border-white/10",
            "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
            "hover:bg-bg-hover transition-colors",
            "text-white placeholder:text-white/40"
          )}
          searchable={true}
          hideSelectAll={false}
          maxCount={10}
          responsive={true}
        />
      </div>
    </div>
  )
}