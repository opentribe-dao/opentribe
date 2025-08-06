'use client';

import { useState } from 'react';
import { VoteButtons } from '../../components/community/vote-buttons';
import { EmailAuthModal } from '../../components/email-auth-modal';

interface VoteSectionProps {
  rfpId: string;
  initialVoteCount: number;
}

export function VoteSection({ rfpId, initialVoteCount }: VoteSectionProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <VoteButtons
        rfpId={rfpId}
        initialCount={initialVoteCount}
        orientation="horizontal"
        size="lg"
        onAuthRequired={() => setShowAuthModal(true)}
      />
      
      <EmailAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}