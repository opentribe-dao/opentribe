'use client'

import { env } from '@/env'
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

// API response interface
interface RfpsStatsResponse {
  total_rfps_count: number
  total_grants_count: number
}

interface RfpsStatsContextType {
  data: RfpsStatsResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

const RfpsStatsContext = createContext<RfpsStatsContextType | undefined>(undefined)

interface RfpsStatsProviderProps {
  children: ReactNode
}

export function RfpsStatsProvider({ children }: RfpsStatsProviderProps) {
  const [data, setData] = useState<RfpsStatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRfpsStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
    
      const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/rfps/stats`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch RFPs stats: ${response.status}`)
      }
      
      const statsData: RfpsStatsResponse = await response.json()
      setData(statsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch RFPs stats'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refetch = () => {
    fetchRfpsStats()
  }

  useEffect(() => {
    fetchRfpsStats()
  }, [fetchRfpsStats])

  const contextValue: RfpsStatsContextType = {
    data,
    isLoading,
    error,
    refetch
  }

  return (
    <RfpsStatsContext.Provider value={contextValue}>
      {children}
    </RfpsStatsContext.Provider>
  )
}

export function useRfpsStats() {
  const context = useContext(RfpsStatsContext)
  
  if (context === undefined) {
    throw new Error('useRfpsStats must be used within a RfpsStatsProvider')
  }
  
  return context
}
