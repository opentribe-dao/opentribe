import { useSearchParams, useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'

export function useBountiesSkillsFilter() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const selectedSkills = useMemo(() => {
    const skillsParam = searchParams.get('skills')
    return skillsParam ? skillsParam.split(',').filter(Boolean) : []
  }, [searchParams])

  const toggleSkill = useCallback((skill: string) => {
    const newSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill]

    updateURL(newSkills)
  }, [selectedSkills])

  const setSkills = useCallback((skills: string[]) => {
    updateURL(skills)
  }, [])

  const clearSkills = useCallback(() => {
    updateURL([])
  }, [])

  const updateURL = useCallback((skills: string[]) => {
    const params = new URLSearchParams(searchParams)

    if (skills.length > 0) {
      params.set('skills', skills.join(','))
    } else {
      params.delete('skills')
    }

    // Use replace to avoid adding history entries for each skill toggle
    router.replace(`/bounties?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  return {
    selectedSkills,
    toggleSkill,
    setSkills,
    clearSkills,
    hasActiveFilters: selectedSkills.length > 0,
  }
}
