'use client'

import { env } from '@/env'
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

// API response interface
interface BountyStatsResponse {
  total_bounties_count: number
  total_rewards_earned: number
}

interface BountyStatsContextType {
  data: BountyStatsResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

const BountyStatsContext = createContext<BountyStatsContextType | undefined>(undefined)

interface BountyStatsProviderProps {
  children: ReactNode
}

export function BountyStatsProvider({ children }: BountyStatsProviderProps) {
  const [data, setData] = useState<BountyStatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBountyStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/stats`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bounty stats: ${response.status}`)
      }
      
      const statsData: BountyStatsResponse = await response.json()
      setData(statsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bounty stats'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refetch = () => {
    fetchBountyStats()
  }

  useEffect(() => {
    fetchBountyStats()
  }, [fetchBountyStats])

  const contextValue: BountyStatsContextType = {
    data,
    isLoading,
    error,
    refetch
  }

  return (
    <BountyStatsContext.Provider value={contextValue}>
      {children}
    </BountyStatsContext.Provider>
  )
}

// Custom hook to use the bounty stats context
export function useBountyStats() {
  const context = useContext(BountyStatsContext)
  
  if (context === undefined) {
    throw new Error('useBountyStats must be used within a BountyStatsProvider')
  }
  
  return context
}
