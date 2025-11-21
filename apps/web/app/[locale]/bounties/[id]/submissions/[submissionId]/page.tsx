"use client";

import { Button } from "@packages/base/components/ui/button";
import { formatCurrency } from "@packages/base/lib/utils";
import { ArrowLeft, Calendar, ExternalLink, Trophy, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { env } from "@/env";
import { SubmissionActions } from "../../components/submission-actions";
import { CommentSection } from "./comment-section";

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

async function getSubmission(
  bountyId: string,
  submissionId: string
): Promise<SubmissionResponse | null> {
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  const res = await fetch(
    `${apiUrl}/api/v1/bounties/${bountyId}/submissions/${submissionId}`,
    {
      credentials: "include",
    }
  );

  if (!res.ok) {
    return null;
  }

  const data: SubmissionResponse = await res.json();
  return data;
}

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

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const { id, submissionId } = await params;
        const data = await getSubmission(id, submissionId);
        if (data?.submission) {
          setSubmission({
            ...data.submission,
            answers: normalizeSubmissionAnswers(data.submission.answers),
          });
        } else {
          setSubmission(null);
        }
      } catch (error) {
        console.error("Error fetching submission:", error);
        setSubmission(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubmission();
  }, [params]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!submission) {
    notFound();
  }

  const isBountyComplete =
    submission.bounty.status?.toUpperCase() === "COMPLETED";
  const isDeadlineDue = submission.bounty.deadline
    ? new Date(submission.bounty.deadline) < new Date()
    : false;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-white/10 border-b">
        <div className="container mx-auto px-6 py-4">
          <Link
            className="inline-flex items-center gap-2 text-white/60 transition-colors hover:text-white"
            href={`/bounties/${submission.bounty.slug || submission.bounty.id}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bounty
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Submission Header */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h1 className="mb-2 font-bold font-heading text-3xl">
                    {submission.title}
                  </h1>
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
                {submission.isWinner && (
                  <div className="text-right">
                    <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/20 px-3 py-1 font-medium text-sm text-yellow-400">
                      <Trophy className="h-4 w-4" />
                      Winner #{submission.position}
                    </div>
                    {submission.winningAmount && (
                      <p className="mt-2 font-bold text-2xl text-green-400">
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
              </div>
            </div>

            {/* Description */}
            <section>
              <h2 className="mb-4 font-bold font-heading text-2xl">
                Description
              </h2>
              <div className="prose prose-invert max-w-none prose-pre:border prose-pre:border-white/10 prose-pre:bg-white/5 prose-headings:font-heading prose-code:text-pink-400 prose-li:text-white/80 prose-p:text-white/80 prose-strong:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {submission.description || "No description provided."}
                </ReactMarkdown>
              </div>
            </section>

            {/* Screening Answers */}
            {submission.answers && submission.answers.length > 0 && (
              <section>
                <h2 className="mb-4 font-bold font-heading text-2xl">
                  Screening Questions
                </h2>
                <div className="space-y-4">
                  {submission.answers.map((answer: ScreeningAnswer, idx: number) => (
                    <div
                      className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                      key={`${answer.question}-${idx}`}
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pink-600/20">
                        <span className="font-bold text-pink-400 text-xs">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium text-white/80">
                          {answer.question}
                        </h4>
                        <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                          <p className="whitespace-pre-line text-sm text-white/70">
                            {answer.answer?.trim()
                              ? answer.answer
                              : "No answer provided."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Comments Section */}
            <section>
              <CommentSection submissionId={submission.id} />
            </section>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Submitter Info Card */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="mb-4 font-medium text-sm text-white/60">
                Submitted By
              </h3>
                <div className="flex items-start gap-3">
                <div className="h-12 w-12 shrink-0 rounded-full bg-linear-to-br from-pink-500 to-purple-600">
                  {submission.submitter.image ? (
                    <Image
                      alt={submission.submitter.username}
                      className="rounded-full"
                      height={48}
                      src={submission.submitter.image}
                      width={48}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-bold text-lg">
                        {submission.submitter.username[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold">
                    {submission.submitter.firstName}{" "}
                    {submission.submitter.lastName}
                  </h4>
                  <Link
                    className="text-sm text-white/60 transition-colors hover:text-white"
                    href={`/profile/${submission.submitter.username}`}
                  >
                    @{submission.submitter.username}
                  </Link>
                </div>
              </div>
              <Link
                className="mt-4 block w-full"
                href={`/profile/${submission.submitter.username}`}
              >
                <Button
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  variant="outline"
                >
                  View Profile
                </Button>
              </Link>
            </div>

            {/* Bounty Info Card */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="mb-4 font-medium text-sm text-white/60">
                Bounty Details
              </h3>
              <h4 className="mb-2 font-semibold">{submission.bounty.title}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Total Prize</span>
                  <span className="font-medium">
                    {formatCurrency(
                      Number(submission.bounty.totalAmount),
                      String(submission.bounty.token)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Winners</span>
                  <span className="font-medium">
                    {submission.bounty.winnerCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Total Submissions</span>
                  <span className="font-medium">
                    {submission.bounty.submissions.length}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  className="block w-full"
                  href={`/bounties/${submission.bounty.slug || submission.bounty.id}`}
                >
                  <Button
                    className="w-full border-white/20 text-white hover:bg-white/10"
                    variant="outline"
                  >
                    View Bounty
                  </Button>
                </Link>

                <SubmissionActions
                  bountyId={submission.bounty.id}
                  className="w-full"
                  layout="column"
                  isBountyComplete={isBountyComplete}
                  isDeadlineDue={isDeadlineDue}
                  submissionId={submission.id}
                  submitterId={submission.submitter.id}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
