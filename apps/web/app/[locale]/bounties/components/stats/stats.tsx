'use client'

import { Separator } from '@packages/base/components/ui/separator'
import { Skeleton } from '@packages/base/components/ui/skeleton'
import { formatCurrency } from '@packages/base/lib/utils'
import { DollarSign, Briefcase } from 'lucide-react'
import { useBountyStats } from './stats-provider'

export function BountyStats() {
  const { data, isLoading, error } = useBountyStats()

  if (error) {
    return (
      <div className='row-start-1 items-center gap-4 sm:flex md:flex lg:row-start-auto'>
        <div className='stats-card flex items-center justify-center text-sm lg:w-full'>
          <span className='text-red-400'>Error loading stats: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className='row-start-1 items-center gap-4 sm:flex md:flex lg:row-start-auto'>
      <div className='stats-card flex justify-around gap-4 text-sm lg:w-full '>
        
        <div className='flex items-center gap-2 '>
            <Briefcase 
              className='rounded-full bg-white/10 p-2' 
              style={{ width: '32px', height: '32px' }} 
            />
          <div className='flex flex-col items-center text-center align-middle'>
            <span className='mb-1 font-bold text-white'>
              {isLoading ? (
                <Skeleton className='mx-4 mb-1 h-4 w-8 bg-white/10' />
              ) : (
                data?.total_bounties_count || 0
              )}
            </span>
            <span className='text-white/60'>Total Bounties</span>
          </div>
        </div>

        <Separator orientation="vertical" className='h-10 bg-white/10 md:h-16' />

        <div className='flex items-center gap-2 '>
            <DollarSign 
              className='rounded-full bg-white/10 p-2' 
              style={{ width: '32px', height: '32px' }} 
            />
          <div className='flex flex-col items-center text-center align-middle'>
            {isLoading ? (
              <Skeleton className='mx-4 mb-1 h-4 w-8 bg-white/10' />
            ) : (
              <span className='mb-1 font-bold text-white'>
                {formatCurrency(data?.total_rewards_earned || 0)}
              </span>
            )}
            <span className='text-white/60'>Total Earned</span>
          </div>
        </div>

      </div>
    </div>
  )
}
