"use client";

import { useState } from "react";
import { AuthModal } from "../../components/auth-modal";
import { VoteButtons } from "../../components/community/vote-buttons";

interface VoteSectionProps {
  rfpId: string;
  initialVoteCount: number;
}

export function VoteSection({ rfpId, initialVoteCount }: VoteSectionProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <VoteButtons
        initialCount={initialVoteCount}
        onAuthRequired={() => setShowAuthModal(true)}
        orientation="horizontal"
        rfpId={rfpId}
        size="lg"
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
