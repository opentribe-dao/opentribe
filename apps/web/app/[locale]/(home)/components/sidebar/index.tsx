'use client'

import { PlatformStats } from './platform-stats'
import { PopularSkills } from './popular-skills'
import { FeaturedOrganizations } from './featured-organizations'
import { RecentActivity } from './recent-activity'
import { HomepageStatsResponse } from '@/hooks/use-home-data'

interface SidebarProps {
  data?: HomepageStatsResponse
  selectedSkills: string[]
  onSkillToggle: (skill: string) => void
  loading?: boolean
  error?: Error | null
}

export function Sidebar({
  data,
  selectedSkills,
  onSkillToggle,
  loading = false,
  error
}: SidebarProps) {

  const popularSkills = data?.popularSkills || []
  const organizations = data?.featuredOrganizations || []
  const recentActivity = data?.recentActivity || []

  if (error) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">Failed to load sidebar data</p>
          <p className="text-sm text-red-300/80 mt-1">{error.message}</p>
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
