"use client";

import { useState } from "react";
import { AuthModal } from "../../components/auth-modal";
import { CommentThread } from "../../components/community/comment-thread";

interface CommentSectionProps {
  rfpId: string;
}

export function CommentSection({ rfpId }: CommentSectionProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <CommentThread
        onAuthRequired={() => setShowAuthModal(true)}
        rfpId={rfpId}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
