"use client";

import { useState } from "react";
import { CommentThread } from "../../components/community/comment-thread";
import { EmailAuthModal } from "../../components/email-auth-modal";

interface CommentSectionProps {
  bountyId: string;
}

export function CommentSection({ bountyId }: CommentSectionProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <CommentThread
        bountyId={bountyId}
        onAuthRequired={() => setShowAuthModal(true)}
      />

      <EmailAuthModal onOpenChange={setShowAuthModal} open={showAuthModal} />
    </>
  );
}
