'use client'

import { DollarSign, Briefcase } from 'lucide-react'
import { Skeleton } from './skeleton'
import { Separator } from './separator'

export interface StatsCardProps {
  type: string
  totalValue: number
  totalCount: number
  isLoading: boolean
}

export function StatsCard({ type, totalValue, totalCount, isLoading }: StatsCardProps) {
  return (
    <div className='row-start-1 items-center gap-4 sm:flex md:flex lg:row-start-auto'>
      <div className='stats-card flex justify-around gap-4 text-sm lg:w-full '>
        <div className='flex items-center gap-2 '>
            <DollarSign className='h-8 w-8 rounded-full bg-white/10 p-2' />
          <div className='flex flex-col '>
            <span className='font-bold text-white mb-2'>{isLoading ? <Skeleton className='h-4 w-24 bg-white/10' /> : totalValue}</span>
            <span className='text-white/60'>Total {type} Earned</span>
          </div>
        </div>

        <div className='flex items-center gap-2 '>
            <Briefcase className='h-8 w-8 rounded-full bg-white/10 p-2' />
          <div className='flex flex-col '>
            <span className='font-bold text-white mb-2'>{isLoading ? <Skeleton className='h-4 w-24 bg-white/10' /> : totalCount}</span>
            <span className='text-white/60'>Total {type} Opportunities</span>
          </div>
        </div>

      </div>
    </div>
  )
}
