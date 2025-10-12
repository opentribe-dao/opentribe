'use client'

import { env } from '@/env'
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

// API response interface
interface GrantsStatsResponse {
  total_grants_count: number
  total_funds: number
}

interface GrantsStatsContextType {
  data: GrantsStatsResponse | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

const GrantsStatsContext = createContext<GrantsStatsContextType | undefined>(undefined)

interface GrantsStatsProviderProps {
  children: ReactNode
}

export function GrantsStatsProvider({ children }: GrantsStatsProviderProps) {
  const [data, setData] = useState<GrantsStatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGrantsStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
    
      const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/v1/grants/stats`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch grants stats: ${response.status}`)
      }
      
      const statsData: GrantsStatsResponse = await response.json()
      setData(statsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch grants stats'
      setError(errorMessage)
      // Error is already set in state, no need to log to console
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refetch = () => {
    fetchGrantsStats()
  }

  useEffect(() => {
    fetchGrantsStats()
  }, [fetchGrantsStats])

  const contextValue: GrantsStatsContextType = {
    data,
    isLoading,
    error,
    refetch
  }

  return (
    <GrantsStatsContext.Provider value={contextValue}>
      {children}
    </GrantsStatsContext.Provider>
  )
}

export function useGrantsStats() {
  const context = useContext(GrantsStatsContext)
  
  if (context === undefined) {
    throw new Error('useGrantsStats must be used within a GrantsStatsProvider')
  }
  
  return context
}
