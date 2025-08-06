'use client';

import { useState } from 'react';
import { CommentThread } from '../../components/community/comment-thread';
import { EmailAuthModal } from '../../components/email-auth-modal';

interface CommentSectionProps {
  rfpId: string;
}

export function CommentSection({ rfpId }: CommentSectionProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <CommentThread
        rfpId={rfpId}
        onAuthRequired={() => setShowAuthModal(true)}
      />
      
      <EmailAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}