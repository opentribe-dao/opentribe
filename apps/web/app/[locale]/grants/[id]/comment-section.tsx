'use client';

import { useState } from 'react';
import { AuthModal } from '../../components/auth-modal';

interface CommentSectionProps {
  grantId: string;
}

export function CommentSection({ grantId }: CommentSectionProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  // For grants, we don't have direct comments. They might have RFPs with comments.
  // But based on the schema, grants don't have direct comments.
  // So this would be empty unless we add grant comments support.
  
  return (
    <div className="mt-8">
      <div className='rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm'>
        <p className="text-center text-white/60">
          Comments are available on RFPs related to this grant.
        </p>
      </div>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}