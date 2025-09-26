'use client'

import { PlatformStats } from './platform-stats'
import { PopularSkills } from './popular-skills'
import { FeaturedOrganizations } from './featured-organizations'
import { RecentActivity } from './recent-activity'
import type { HomepageStatsResponse } from '@/hooks/use-home-data'

interface SidebarProps {
  data?: HomepageStatsResponse
  selectedSkills: string[]
  onSkillToggle: (skill: string) => void
  loading?: boolean
  error?: Error | null
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function Sidebar({
  data,
  selectedSkills,
  onSkillToggle,
  loading = false,
  error,
  hasActiveFilters,
  onClearFilters
}: SidebarProps) {

  const popularSkills = data?.popularSkills || []
  const organizations = data?.featuredOrganizations || []
  const recentActivity = data?.recentActivity || []

  if (error) {
    return (
      <div className="space-y-6">
        <div className='rounded-lg border border-red-500/20 bg-red-500/10 p-6'>
          <p className="text-red-400">Failed to load sidebar data</p>
          <p className='mt-1 text-red-300/80 text-sm'>{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PlatformStats
        stats={data?.platformStats}
        loading={loading || !data}
      />
      <PopularSkills
        skills={popularSkills}
        selectedSkills={selectedSkills}
        onSkillToggle={onSkillToggle}
        loading={loading}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
      />

      <FeaturedOrganizations
        featuredOrganizations={organizations}
        loading={loading}
      />

      <RecentActivity
        activities={recentActivity}
        loading={loading}
      />
    </div>
  )
}
