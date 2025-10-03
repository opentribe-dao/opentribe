"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@packages/base/components/ui/tabs";
import { FileText, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@packages/base/components/ui/dialog";
import { X } from "lucide-react";
import { SubmissionModal } from "./submission-modal";
import Image from "next/image";
import { Button } from "@packages/base/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDistanceToNow } from "date-fns";

interface BountyContentProps {
  bounty: any;
  children: React.ReactNode; // This will be the comment section
}

export function BountyContent({ bounty, children }: BountyContentProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSubmissionId = searchParams.get("submission");

  // Only show tabs if winners have been announced and there are submissions
  const showTabs = bounty.winnersAnnouncedAt && bounty.submissions.length > 0;

  const handleSubmissionClick = (submissionId: string) => {
    router.push(`/bounties/${bounty.id}?submission=${submissionId}`, {
      scroll: false,
    });
  };

  const handleCloseModal = () => {
    router.push(`/bounties/${bounty.id}`, { scroll: false });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const SubmissionCard = ({ submission }: { submission: any }) => (
    <div
      onClick={() => handleSubmissionClick(submission.id)}
      className="block p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex-shrink-0">
            {submission.submitter.image ? (
              <Image
                src={submission.submitter.image}
                alt={submission.submitter.username}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-sm font-bold">
                  {submission.submitter.username[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white">{submission.title}</h4>
            <p className="text-sm text-white/60">
              by @{submission.submitter.username} •{" "}
              {formatDistanceToNow(new Date(submission.createdAt), {
                addSuffix: true,
              })}
            </p>
            {submission.description && (
              <p className="text-sm text-white/70 mt-1 line-clamp-2">
                {submission.description}
              </p>
            )}
          </div>
        </div>
        {submission.isWinner && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-full border border-yellow-500/30">
              <span className="text-lg">🏆</span>
              <span className="text-sm font-medium text-yellow-400 whitespace-nowrap">
                Winner #{submission.position}
              </span>
            </div>
            {submission.winningAmount && (
              <div className="text-right">
                <p className="text-xs text-white/60">Prize</p>
                <p className="text-lg font-bold text-green-400 whitespace-nowrap">
                  {formatAmount(submission.winningAmount)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const BountyDetails = () => (
    <>
      {/* Description */}
      <section>
        <h2 className="text-2xl font-bold font-heading mb-4">Description</h2>
        <div className="prose prose-invert max-w-none prose-headings:font-heading prose-p:text-white/80 prose-li:text-white/80 prose-strong:text-white prose-code:text-pink-400 prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {bounty.description}
          </ReactMarkdown>
        </div>
      </section>

      {/* Acceptance Criteria */}
      {bounty.screening && (
        <section>
          <h2 className="text-2xl font-bold font-heading mb-4">
            Acceptance Criteria
          </h2>
          <div className="space-y-3">
            {(Array.isArray(bounty.screening) ? bounty.screening : []).map(
              (criteria: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10"
                >
                  <div className="w-6 h-6 rounded-full bg-pink-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-pink-400">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white/80">{criteria.question}</p>
                    {criteria.optional && (
                      <span className="text-xs text-white/50 mt-1 inline-block">
                        Optional
                      </span>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}
    </>
  );

  const SubmissionsList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold font-heading">
          All Submissions ({bounty.submissions.length})
        </h2>
      </div>

      {/* Winners Section */}
      {bounty.submissions.filter((s: any) => s.isWinner).length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🏆 Winners
          </h3>
          <div className="space-y-3">
            {bounty.submissions
              .filter((s: any) => s.isWinner)
              .sort((a: any, b: any) => a.position - b.position)
              .map((submission: any) => (
                <SubmissionCard key={submission.id} submission={submission} />
              ))}
          </div>
        </div>
      )}

      {/* Other Submissions */}
      {bounty.submissions.filter((s: any) => !s.isWinner).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Other Submissions
          </h3>
          <div className="space-y-3">
            {bounty.submissions
              .filter((s: any) => !s.isWinner)
              .map((submission: any) => (
                <SubmissionCard key={submission.id} submission={submission} />
              ))}
          </div>
        </div>
      )}
    </div>
  );

  if (!showTabs) {
    // No tabs - just show the details and comments
    return (
      <div className="space-y-8">
        <BountyDetails />
        {children}
      </div>
    );
  }

  // Show tabs when winners are announced
  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="submissions" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Submissions ({bounty.submissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-8">
          <BountyDetails />
        </TabsContent>

        <TabsContent value="submissions" className="mt-6">
          <SubmissionsList />
        </TabsContent>
      </Tabs>

      {/* Comments always shown below tabs */}
      {children}

      {/* Submission Modal */}
      {selectedSubmissionId && (
        <SubmissionModal
          bountyId={bounty.id}
          submissionId={selectedSubmissionId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
