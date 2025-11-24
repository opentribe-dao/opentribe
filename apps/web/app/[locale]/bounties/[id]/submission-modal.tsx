"use client";

import { Button } from "@packages/base/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@packages/base/components/ui/dialog";
import { formatCurrency } from "@packages/base/lib/utils";
import { Calendar, ExternalLink, Trophy, User, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { env } from "@/env";
import { SubmissionActions } from "./components/submission-actions";
import { CommentSection } from "./submissions/[submissionId]/comment-section";

type ScreeningAnswer = {
  question: string;
  answer: string;
};

type Submission = {
  id: string;
  title: string;
  description: string;
  submissionUrl: string;
  isWinner: boolean;
  position: number;
  winningAmount: number;
  createdAt: string;
  submitter: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  };
  answers: ScreeningAnswer[];
  bounty: {
    id: string;
    slug: string;
    title: string;
    totalAmount: number;
    token: string;
    winnerCount: number;
    status?: string;
    deadline?: string | null;
    submissions: Submission[];
  };
};

type RawAnswers =
  | Submission["answers"]
  | Record<string, string>
  | null
  | undefined;

type SubmissionResponse = {
  submission: Omit<Submission, "answers"> & {
    answers: RawAnswers;
  };
};

type SubmissionModalProps = {
  bountyId: string;
  submissionId: string;
  onClose: () => void;
};

const normalizeSubmissionAnswers = (
  answers: RawAnswers
): ScreeningAnswer[] => {
  if (!answers) {
    return [];
  }

  if (Array.isArray(answers)) {
    return answers;
  }

  return Object.entries(answers).map(([question, answer]) => ({
    question,
    answer,
  }));
};

export function SubmissionModal({
  bountyId,
  submissionId,
  onClose,
}: SubmissionModalProps) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSubmission = async () => {
      try {
        const res = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bountyId}/submissions/${submissionId}`
        );

        const data: SubmissionResponse = await res.json();

        if (!isMounted) {
          return;
        }

        if (data.submission) {
          setSubmission({
            ...data.submission,
            answers: normalizeSubmissionAnswers(data.submission.answers),
          });
        } else {
          setSubmission(null);
        }
      } catch (error) {
        console.error("Failed to load submission:", error);
        if (isMounted) {
          setSubmission(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSubmission();

    return () => {
      isMounted = false;
    };
  }, [bountyId, submissionId]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const renderDialogBody = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-pink-500 border-b-2" />
        </div>
      );
    }

    if (!submission) {
      return (
        <div className="py-12 text-center">
          <p className="text-white/60">Submission not found</p>
        </div>
      );
    }

    const isBountyComplete =
      submission.bounty.status?.toUpperCase() === "COMPLETED";
    const isDeadlineDue = submission.bounty.deadline
      ? new Date(submission.bounty.deadline) < new Date()
      : false;

    return (
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
                          className="transition-colors hover:text-white"
                          href={`/profile/${submission.submitter.username}`}
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
              <div className="flex flex-wrap items-center gap-3">
                {submission.submissionUrl && (
                  <a
                    className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-white transition-colors hover:bg-pink-700"
                    href={submission.submissionUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Submission
                  </a>
                )}
                <SubmissionActions
                  bountyId={bountyId}
                  isBountyComplete={isBountyComplete}
                  isDeadlineDue={isDeadlineDue}
                  submissionId={submission.id}
                  submitterId={submission.submitter.id}
                />
              </div>
            </div>

            {/* Description */}
            <section>
              <h3 className="mb-3 font-semibold text-lg">Description</h3>
              <div className="prose prose-invert prose-sm max-w-none prose-pre:border prose-pre:border-white/10 prose-pre:bg-white/5 prose-headings:font-heading prose-code:text-pink-400 prose-li:text-white/80 prose-p:text-white/80 prose-strong:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {submission.description || "No description provided."}
                </ReactMarkdown>
              </div>
            </section>

            {/* Screening Answers */}
            {submission.answers && submission.answers.length > 0 && (
              <section>
                <h3 className="mb-3 font-semibold text-lg">
                  Screening Questions
                </h3>
                <div className="space-y-3">
                  {submission.answers.map((answer: ScreeningAnswer, idx: number) => (
                    <div
                      className="rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
                      key={`${answer.question}-${idx}`}
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
                className="text-pink-400 text-sm transition-colors hover:text-pink-300"
                href={`/bounties/${bountyId}/submissions/${submissionId}`}
              >
                View full page →
              </Link>
            </div>

            {/* Comments */}
            <section className="border-white/10 border-t pt-6">
              <CommentSection submissionId={submission.id} />
            </section>
          </div>
    );
  };

  return (
    <Dialog onOpenChange={onClose} open={true}>
      <DialogContent
        className="max-h-[90vh] max-w-4xl overflow-y-auto border-white/10 bg-black/95 backdrop-blur-xl"
        showCloseButton={false}
      >
        <DialogHeader className="relative flex-row items-center justify-between">
          <DialogTitle>{"Submission Details"}</DialogTitle>
          <Button
            className="absolute top-0 right-0"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {renderDialogBody()}
      </DialogContent>
    </Dialog>
  );
}
