"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "motion/react"
import { cn } from "@packages/base/lib/utils"
import { Button } from "./button"
import { useIsMobile } from "@packages/base/hooks/use-mobile"

interface ExpandableTextProps {
  children: React.ReactNode
  maxHeight?: number
  className?: string
  mobileOnly?: boolean
}

export function ExpandableText({ children, maxHeight = 400, className, mobileOnly = false }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [fullHeight, setFullHeight] = useState<number>(0)
  const isMobile = useIsMobile()
  const contentRef = useRef<HTMLDivElement>(null)

  const isExpandable = !mobileOnly || isMobile

  useEffect(() => {
    if (contentRef.current && isExpandable) {
      setFullHeight(contentRef.current.scrollHeight)
    }
  }, [children, isExpandable])

  if (!isExpandable) {
    return (
      <div className={cn("relative", className)}>
        <div className="prose prose-sm dark:prose-invert max-w-none px-4 py-8">{children}</div>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      {/* Top gradient */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-16 bg-gradient-to-b" />

      <motion.div
        className="relative overflow-hidden"
        initial={false}
        animate={{
          height: isExpanded ? fullHeight : maxHeight,
        }}
        transition={{
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1], // Custom ease-out curve
        }}
      >
        <div ref={contentRef} className="prose prose-sm dark:prose-invert max-w-none px-4 py-6">
          {children}
        </div>

        {/* Bottom gradient overlay when collapsed */}
        {!isExpanded && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32" />
        )}
      </motion.div>

      {/* View More/Less Button */}
      <div className="relative z-20 flex justify-center pb-4">
        <Button onClick={() => setIsExpanded(!isExpanded)} variant="outline" size="sm" className="shadow-lg">
          {isExpanded ? "View Less ↑" : "View More ↓"}
        </Button>
      </div>

      {/* Bottom gradient when expanded */}
      {isExpanded && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-16" />
      )}
    </div>
  )
}
