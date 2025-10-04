'use client'

import { DollarSign, Briefcase } from 'lucide-react'
import { Skeleton } from './skeleton'
import { formatCurrency } from '../../lib/utils'

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
            <Briefcase 
              className='rounded-full bg-white/10 p-2' 
              style={{ width: '32px', height: '32px' }} 
            />
          <div className='flex flex-col align-middle items-center'>
            <span className='font-bold text-white mb-1'>{isLoading ? <Skeleton className='h-4 w-24 bg-white/10 mx-4 mb-1' /> : totalCount}</span>
            <span className='text-white/60'>Total {type}</span>
          </div>
        </div>

        <div className='flex items-center gap-2 '>
            <DollarSign 
              className='rounded-full bg-white/10 p-2' 
              style={{ width: '32px', height: '32px' }} 
            />
          <div className='flex flex-col align-middle items-center'>
            {isLoading ? (
              <Skeleton className='h-4 w-24 bg-white/10 mx-4 mb-1' />
            ) : (
              <span className='font-bold text-white mb-1'>
                {formatCurrency(totalValue)}
              </span>
            )}
            <span className='text-white/60'>Total Earned</span>
          </div>
        </div>

      </div>
    </div>
  )
}
