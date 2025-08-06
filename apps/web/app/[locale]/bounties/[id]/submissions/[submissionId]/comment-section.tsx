'use client';

import { useState } from 'react';
import { CommentThread } from '../../../../components/community/comment-thread';
import { EmailAuthModal } from '../../../../components/email-auth-modal';

interface CommentSectionProps {
  submissionId: string;
}

export function CommentSection({ submissionId }: CommentSectionProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <CommentThread
        submissionId={submissionId}
        onAuthRequired={() => setShowAuthModal(true)}
      />

      <EmailAuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
