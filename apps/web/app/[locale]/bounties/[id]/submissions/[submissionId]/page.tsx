import { env } from "@/env";
import { Button } from "@packages/base/components/ui/button";
import { ArrowLeft, Calendar, ExternalLink, Trophy, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CommentSection } from "./comment-section";

async function getSubmission(bountyId: string, submissionId: string) {
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  const res = await fetch(
    `${apiUrl}/api/v1/bounties/${bountyId}/submissions/${submissionId}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data;
}

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = await params;
  const data = await getSubmission(id, submissionId);

  if (!data?.submission) {
    notFound();
  }

  const { submission } = data;

  // Format currency
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
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-white/10 border-b">
        <div className="container mx-auto px-6 py-4">
          <Link
            href={`/bounties/${id}`}
            className="inline-flex items-center gap-2 text-white/60 transition-colors hover:text-white"
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
                {submission.isWinner && (
                  <div className="text-right">
                    <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/20 px-3 py-1 font-medium text-sm text-yellow-400">
                      <Trophy className="h-4 w-4" />
                      Winner #{submission.position}
                    </div>
                    {submission.winningAmount && (
                      <p className="mt-2 font-bold text-2xl text-green-400">
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
                  className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-white transition-colors hover:bg-pink-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Submission
                </a>
              )}
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
                  Screening Answers
                </h2>
                <div className="space-y-4">
                  {submission.answers.map((answer: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                    >
                      <h4 className="mb-2 font-medium text-white/80">
                        {answer.question}
                      </h4>
                      <p className="text-white/60">{answer.answer}</p>
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
                <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
                  {submission.submitter.avatarUrl ? (
                    <Image
                      src={submission.submitter.avatarUrl}
                      alt={submission.submitter.username}
                      width={48}
                      height={48}
                      className="rounded-full"
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
                    href={`/profile/${submission.submitter.username}`}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    @{submission.submitter.username}
                  </Link>
                </div>
              </div>
              <Link
                href={`/profile/${submission.submitter.username}`}
                className="mt-4 block w-full"
              >
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
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
                    {formatAmount(submission.bounty.totalAmount)}{" "}
                    {submission.bounty.token}
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
              <Link href={`/bounties/${id}`} className="mt-4 block w-full">
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  View Bounty
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
