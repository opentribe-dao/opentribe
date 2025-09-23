"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@packages/base/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@packages/base/components/ui/dialog";
import { X, Calendar, ExternalLink, Trophy, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CommentSection } from "./submissions/[submissionId]/comment-section";
import { env } from "@/env";

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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-xl border-white/10">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
          </div>
        ) : submission ? (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold font-heading mb-2">
                    {submission.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <Link
                        href={`/profile/${submission.submitter.username}`}
                        className="hover:text-white transition-colors"
                      >
                        @{submission.submitter.username}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(submission.createdAt)}
                    </div>
                  </div>
                </div>
                {submission.isWinner && (
                  <div className="text-right">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
                      <Trophy className="w-4 h-4" />
                      Winner #{submission.position}
                    </div>
                    {submission.winningAmount && (
                      <p className="text-lg font-bold text-green-400 mt-1">
                        {formatAmount(submission.winningAmount)}
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Submission
                </a>
              )}
            </div>

            {/* Description */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <div className="prose prose-invert prose-sm max-w-none prose-headings:font-heading prose-p:text-white/80 prose-li:text-white/80 prose-strong:text-white prose-code:text-pink-400 prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {submission.description || "No description provided."}
                </ReactMarkdown>
              </div>
            </section>

            {/* Screening Answers */}
            {submission.answers && submission.answers.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-3">
                  Screening Answers
                </h3>
                <div className="space-y-3">
                  {submission.answers.map((answer: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"
                    >
                      <h4 className="font-medium text-white/80 mb-1 text-sm">
                        {answer.question}
                      </h4>
                      <p className="text-white/60 text-sm">{answer.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* View Full Page Link */}
            <div className="flex justify-end pt-4 border-t border-white/10">
              <Link
                href={`/bounties/${bountyId}/submissions/${submissionId}`}
                className="text-sm text-pink-400 hover:text-pink-300 transition-colors"
              >
                View full page →
              </Link>
            </div>

            {/* Comments */}
            <section className="border-t border-white/10 pt-6">
              <CommentSection submissionId={submission.id} />
            </section>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/60">Submission not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
