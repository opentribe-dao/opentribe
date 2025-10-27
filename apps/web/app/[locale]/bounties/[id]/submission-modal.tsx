'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@packages/base/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@packages/base/components/ui/dialog';
import { X, Calendar, ExternalLink, Trophy, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CommentSection } from './submissions/[submissionId]/comment-section';
import { env } from '@/env';
import { formatCurrency } from '@packages/base/lib/utils';

interface SubmissionModalProps {
  bountyId: string;
  submissionId: string;
  onClose: () => void;
}

export function SubmissionModal({
  bountyId,
  submissionId,
  onClose,
}: SubmissionModalProps) {
  const [submission, setSubmission] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch submission data
    fetch(
      `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bountyId}/submissions/${submissionId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.submission) {
          setSubmission(data.submission);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [bountyId, submissionId]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        className="max-h-[90vh] max-w-4xl overflow-y-auto border-white/10 bg-black/95 backdrop-blur-xl"
        showCloseButton={false}
      >
        
        <DialogHeader className='relative flex-row items-center justify-between'>
        <DialogTitle>{'Submission Details'}</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-pink-500 border-b-2" />
          </div>
        ) : submission ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="mb-4 flex items-start justify-between">
                <DialogTitle>
                  <div>
                    <h2 className="mb-2 font-bold font-heading text-2xl">
                      {submission.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <Link
                          href={`/profile/${submission.submitter.username}`}
                          className="transition-colors hover:text-white"
                        >
                          @{submission.submitter.username}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(submission.createdAt)}
                      </div>
                    </div>
                  </div>
                </DialogTitle>
                {submission.isWinner && (
                  <div className="text-right">
                    <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/20 px-3 py-1 font-medium text-sm text-yellow-400">
                      <Trophy className="h-4 w-4" />
                      Winner #{submission.position}
                    </div>
                    {submission.winningAmount && (
                      <p className="mt-1 font-bold text-green-400 text-lg">
                        {formatCurrency(
                          Number(submission.winningAmount),
                          String(submission.bounty.token)
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Submission URL */}
              {submission.submissionUrl && (
                <a
                  href={submission.submissionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-white transition-colors hover:bg-pink-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Submission
                </a>
              )}
            </div>

            {/* Description */}
            <section>
              <h3 className="mb-3 font-semibold text-lg">Description</h3>
              <div className="prose prose-invert prose-sm max-w-none prose-pre:border prose-pre:border-white/10 prose-pre:bg-white/5 prose-headings:font-heading prose-code:text-pink-400 prose-li:text-white/80 prose-p:text-white/80 prose-strong:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {submission.description || 'No description provided.'}
                </ReactMarkdown>
              </div>
            </section>

            {/* Screening Answers */}
            {submission.answers && submission.answers.length > 0 && (
              <section>
                <h3 className="mb-3 font-semibold text-lg">
                  Screening Answers
                </h3>
                <div className="space-y-3">
                  {submission.answers.map((answer: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
                    >
                      <h4 className="mb-1 font-medium text-sm text-white/80">
                        {answer.question}
                      </h4>
                      <p className="text-sm text-white/60">{answer.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* View Full Page Link */}
            <div className="flex justify-end border-white/10 border-t pt-4">
              <Link
                href={`/bounties/${bountyId}/submissions/${submissionId}`}
                className="text-pink-400 text-sm transition-colors hover:text-pink-300"
              >
                View full page →
              </Link>
            </div>

            {/* Comments */}
            <section className="border-white/10 border-t pt-6">
              <CommentSection submissionId={submission.id} />
            </section>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-white/60">Submission not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
