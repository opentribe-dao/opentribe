'use client';

import type React from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import {
  useBounty,
  useBountySubmissions,
  type BountyDetails,
  type Submission,
} from '@/hooks/use-bounty';
import { toast } from 'sonner';
import { env } from '@/env';

interface BountyContextType {
  bounty: BountyDetails | undefined;
  bountyLoading: boolean;
  bountyError: Error | null;
  refreshBounty: () => void;

  submissions: Submission[];
  submissionsLoading: boolean;
  submissionsError: Error | null;
  refreshSubmissions: () => void;

  selectedWinners: Map<string, { position: number; amount: number }>;
  setSelectedWinners: (
    winners: Map<string, { position: number; amount: number }>
  ) => void;
  clearSelectedWinners: () => void;

  announceWinners: () => Promise<void>;
  isAnnouncing: boolean;
}

const BountyContext = createContext<BountyContextType | null>(null);

export function BountyProvider({
  children,
  bountyId,
}: { children: React.ReactNode; bountyId: string }) {
  // Bounty data via react-query
  const {
    data: bounty,
    isLoading: bountyLoading,
    error: bountyError,
    refetch: refreshBounty,
  } = useBounty(bountyId);

  // Submissions data via react-query
  const {
    data: submissions = [],
    isLoading: submissionsLoading,
    error: submissionsError,
    refetch: refreshSubmissions,
  } = useBountySubmissions(bountyId);

  // Winner selection state
  const [selectedWinners, setSelectedWinners] = useState<
    Map<string, { position: number; amount: number }>
  >(new Map());
  const [isAnnouncing, setIsAnnouncing] = useState(false);

  // Announce winners function
  const announceWinners = useCallback(async () => {
    if (selectedWinners.size === 0) {
      toast.error('Please select at least one winner');
      return;
    }
    setIsAnnouncing(true);
    try {
      const winners = Array.from(selectedWinners.entries()).map(
        ([submissionId, data]) => ({
          submissionId,
          position: data.position,
          amount: data.amount,
        })
      );
      const res = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bountyId}/winners`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ winners }),
        }
      );
      if (!res.ok) {
        throw new Error('Failed to announce winners');
      }
      toast.success('Winners announced successfully!');
      setSelectedWinners(new Map());
      refreshBounty();
      refreshSubmissions();
    } catch (error) {
      toast.error('Failed to announce winners');
    } finally {
      setIsAnnouncing(false);
    }
  }, [selectedWinners, bountyId, refreshBounty, refreshSubmissions]);

  return (
    <BountyContext.Provider
      value={{
        bounty,
        bountyLoading,
        bountyError: bountyError as Error | null,
        refreshBounty,
        submissions: Array.isArray(submissions) ? submissions : [],
        submissionsLoading,
        submissionsError: submissionsError as Error | null,
        refreshSubmissions,
        selectedWinners,
        setSelectedWinners,
        clearSelectedWinners: () => setSelectedWinners(new Map()),
        announceWinners,
        isAnnouncing,
      }}
    >
      {children}
    </BountyContext.Provider>
  );
}

export function useBountyContext() {
  const ctx = useContext(BountyContext);
  if (!ctx) {
    throw new Error('useBountyContext must be used within a BountyProvider');
  }
  return ctx;
}
