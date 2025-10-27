'use client';

import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@packages/base/components/ui/button';
import { cn } from '@packages/base/lib/utils';
import { getUserVotes, createOrUpdateVote, removeVote } from '../../lib/api/community';
import { useSession } from '@packages/auth/client';
import { toast } from 'sonner';

interface VoteButtonsProps {
  rfpId: string;
  initialCount: number;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
  onAuthRequired?: () => void;
}

export function VoteButtons({
  rfpId,
  initialCount,
  orientation = 'vertical',
  size = 'md',
  showCount = true,
  className,
  onAuthRequired,
}: VoteButtonsProps) {
  const { data: session, isPending } = useSession();
  const [voteDirection, setVoteDirection] = useState<'UP' | 'DOWN' | null>(null);
  const [voteCount, setVoteCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  // Check user's existing vote
  useEffect(() => {
    if (!session?.user || !rfpId) return;

    getUserVotes([rfpId]).then((result) => {
      if (result.votes[rfpId]) {
        setVoteDirection(result.votes[rfpId]);
      }
    }).catch(console.error);
  }, [session?.user, rfpId]);

  const handleVote = async (direction: 'UP' | 'DOWN') => {
    if (!session?.user) {
      onAuthRequired?.();
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    const prevDirection = voteDirection;
    const prevCount = voteCount;

    try {
      if (voteDirection === direction) {
        // Remove vote
        setVoteDirection(null);
        setVoteCount(direction === 'UP' ? prevCount - 1 : prevCount + 1);
        await removeVote(rfpId);
      } else {
        // Create or update vote
        const wasUpvoted = voteDirection === 'UP';
        const wasDownvoted = voteDirection === 'DOWN';
        
        setVoteDirection(direction);
        
        // Calculate new count
        let newCount = prevCount;
        if (direction === 'UP') {
          newCount = wasDownvoted ? prevCount + 2 : prevCount + 1;
        } else {
          newCount = wasUpvoted ? prevCount - 2 : prevCount - 1;
        }
        setVoteCount(newCount);
        
        await createOrUpdateVote(rfpId, direction);
      }
    } catch (error) {
      // Revert on error
      setVoteDirection(prevDirection);
      setVoteCount(prevCount);
      toast.error(error instanceof Error ? error.message : 'Failed to vote');
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const containerClasses = cn(
    'flex items-center',
    orientation === 'vertical' ? 'flex-col gap-1' : 'gap-2',
    className
  );

  return (
    <div className={containerClasses}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleVote('UP')}
        disabled={isLoading || isPending}
        className={cn(
          sizeClasses[size],
          'transition-colors',
          voteDirection === 'UP' && 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
        )}
      >
        <ChevronUp className={cn(iconSizes[size], voteDirection === 'UP' && 'fill-current')} />
      </Button>

      {showCount && (
        <span className={cn(
          'font-semibold tabular-nums',
          orientation === 'vertical' ? 'text-sm' : 'text-base',
          voteCount > 0 ? 'text-green-500' : voteCount < 0 ? 'text-red-500' : 'text-white/60'
        )}>
          {voteCount > 0 && '+'}{voteCount}
        </span>
      )}

      {/* <Button
        variant="ghost"
        size="icon"
        onClick={() => handleVote('DOWN')}
        disabled={isLoading || isPending}
        className={cn(
          sizeClasses[size],
          'transition-colors',
          voteDirection === 'DOWN' && 'text-red-500 bg-red-500/10 hover:bg-red-500/20'
        )}
      >
        <ChevronDown className={cn(iconSizes[size], voteDirection === 'DOWN' && 'fill-current')} />
      </Button> */}
    </div>
  );
}