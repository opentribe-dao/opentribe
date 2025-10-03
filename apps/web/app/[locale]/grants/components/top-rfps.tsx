'use client'

import React from 'react'
import Link from 'next/link'
import { Skeleton } from "@packages/base/components/ui/skeleton"
import { ThumbsUp } from "lucide-react"
import { cn } from '@packages/base/lib/utils'

export interface TopRFP {
  id: string
  title: string
  voteCount: number
  grant: {
    organization: {
      name: string
    }
  }
}

interface TopRFPsProps {
  topRFPs: TopRFP[]
  topRFPsLoading: boolean
  topRFPsError: Error | null
  className?: string
}

const getGradientClass = (index: number) => {
  switch (index) {
    case 0: return 'from-yellow-500 to-orange-600'
    case 1: return 'from-gray-400 to-gray-600'
    case 2: return 'from-amber-600 to-yellow-700'
    default: return 'from-pink-500 to-purple-600'
  }
}

export function TopRFPsCard({
  topRFPs,
  topRFPsLoading,
  topRFPsError,
  className = ''
}: TopRFPsProps) {
  return (
    <div className={cn('rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm', className)}>
      <h3 className='mb-4 font-heading font-semibold text-lg'>Top RFP's</h3>
      
      {topRFPsLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='flex items-center gap-3 rounded-lg p-2'>
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="mb-1 h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      )}

      {topRFPsError && (
        <div className='rounded-lg border border-red-500/20 bg-red-500/10 p-4'>
          <div className='font-medium text-red-400 text-sm'>Error loading RFPs</div>
          <div className='mt-1 text-red-300 text-xs'>
            {topRFPsError.message || 'Failed to load top RFPs'}
          </div>
        </div>
      )}

      {!topRFPsLoading && !topRFPsError && topRFPs.length === 0 && (
        <div className='py-4 text-center'>
          <div className='text-sm text-white/40'>No RFPs available</div>
        </div>
      )}

      {!topRFPsLoading && !topRFPsError && topRFPs.length > 0 && (
        <div className="space-y-3">
          {topRFPs.map((rfp, index) => (
             <Link
             key={rfp.id}
             href={`/rfps/${rfp.id}`}
             className='flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5'
             aria-label={`View RFP: ${rfp.title} by ${rfp.grant.organization.name}`}
           >
             <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${
               index === 0 ? 'from-yellow-500 to-orange-600' :
               index === 1 ? 'from-gray-400 to-gray-600' :
               index === 2 ? 'from-amber-600 to-yellow-700' :
               'from-pink-500 to-purple-600'
             }`}>
               <span className='font-bold font-heading text-sm text-white'>
                 {index + 1}
               </span>
             </div>
             <div className="min-w-0 flex-1">
               <h4 className='line-clamp-1 font-medium text-sm text-white'>{rfp.title}</h4>
               <p className='truncate text-white/50 text-xs'>{rfp.grant.organization.name}</p>
             </div>
             <div className='flex items-center gap-1 text-white/60 text-xs'>
               <ThumbsUp className='h-3 w-3' />
               <span>{rfp.voteCount}</span>
             </div>
           </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default React.memo(TopRFPsCard)
