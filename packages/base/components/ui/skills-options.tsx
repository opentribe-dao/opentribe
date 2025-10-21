"use client"

import React, { useState, useEffect, useRef } from "react"
import { MultiSelect } from "@packages/base/components/ui/multi-select"
import { skillsOptions } from "@packages/base/lib/skills"
import { cn } from "@packages/base/lib/utils"

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
  const [selectedSkills, setSelectedSkills] = useState<string[]>(value)
  const isInternalUpdate = useRef(false)

  // Update internal state when value prop changes (for external control)
  useEffect(() => {
    if (!isInternalUpdate.current) {
      setSelectedSkills(value)
    }
    isInternalUpdate.current = false
  }, [value])

  // Handle skill selection changes
  const handleSkillsChange = (skills: string[]) => {
    isInternalUpdate.current = true
    setSelectedSkills(skills)
    onChange?.(skills) // Call parent onChange if provided
  }

  return (
    <div className={cn("space-y-6 border-white/20 bg-white/5 text-white placeholder:text-white/40", className)}>
      <div>
        <MultiSelect
          options={skillsOptions}
          onValueChange={handleSkillsChange}
          defaultValue={selectedSkills}
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
          maxCount={8}
          responsive={true}
          resetOnDefaultValueChange={false}
        />
      </div>
    </div>
  )
}