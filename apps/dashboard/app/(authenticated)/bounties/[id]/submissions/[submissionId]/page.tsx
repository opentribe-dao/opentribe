"use client";

import { Badge } from "@packages/base/components/ui/badge";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Label } from "@packages/base/components/ui/label";
import { Textarea } from "@packages/base/components/ui/textarea";
import { getSkillLabel } from "@packages/base/lib/skills";
import {
  ArrowLeft,
  Calendar,
  Check,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { useBountyContext } from "../../../../components/bounty-provider";

export default function SubmissionReviewPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = use(params);
  const router = useRouter();

  useEffect(() => {
    if (id && submissionId) {
      fetchSubmissionDetails(id, submissionId);
    }
  }, [id, submissionId]);

  const {
    currentSubmission: submission,
    submissionLoading: loading,
    submissionActionLoading: actionLoading,
    submissionFeedback: feedback,
    setSubmissionFeedback: setFeedback,
    selectedPosition,
    setSelectedPosition,
    fetchSubmissionDetails,
    updateSubmissionStatus,
    refreshSubmissions,
    selectedWinners,
    setSelectedWinners,
  } = useBountyContext();

  const handleSelectWinner = (
    submissionId: string,
    position: number,
    amount: string,
    username: string
  ) => {
    const newSelected = new Map(selectedWinners);

    // Check if this submission is already selected
    if (newSelected.has(submissionId)) {
      newSelected.delete(submissionId);
    } else {
      // Remove any other submission with the same position
      for (const [id, data] of newSelected) {
        if (data.position === position) {
          newSelected.delete(id);
        }
      }
      newSelected.set(submissionId, { position, amount, username });
    }

    setSelectedWinners(newSelected);
  };

  const handleStatusUpdate = async (newStatus: "APPROVED" | "REJECTED") => {
    if (!feedback && newStatus === "REJECTED") {
      toast.error("Please provide feedback when rejecting a submission");
      return;
    }

    if (newStatus === "APPROVED" && selectedPosition === null) {
      toast.error("Please select a winner position");
      return;
    }

    try {
      await updateSubmissionStatus(
        id,
        submissionId,
        newStatus,
        feedback,
        selectedPosition || undefined
      );

      if (newStatus === "APPROVED") {
        handleSelectWinner(
          submissionId,
          selectedPosition ?? 0,
          "",
          submission?.creator.username ?? ""
        );
        setSelectedPosition(null);
      }

      router.back();

      refreshSubmissions();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-US").format(amount);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-500/20 text-blue-400";
      case "UNDER_REVIEW":
        return "bg-yellow-500/20 text-yellow-400";
      case "APPROVED":
        return "bg-green-500/20 text-green-400";
      case "REJECTED":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-white/10 text-white/60";
    }
  };

  const getAvailablePositions = () => {
    if (!submission) {
      return [];
    }

    // Use selectedWinners (Map<submissionId, { position, amount, username }>) to determine taken positions
    // Exclude the current submission's position if editing
    const takenPositions = new Set<number>();
    if (selectedWinners && typeof selectedWinners.forEach === "function") {
      selectedWinners.forEach((winner, winnerSubmissionId) => {
        if (winnerSubmissionId !== submission.id && winner.position != null) {
          takenPositions.add(winner.position);
        }
      });
    }

    // Create array of available positions
    const positions = [];
    for (let i = 1; i <= submission.bounty.winnerCount; i++) {
      const prize = submission.bounty.winnings.find((w) => w.position === i);
      if (prize) {
        // If the position is not taken, it's available
        const available = !takenPositions.has(i);
        positions.push({
          position: i,
          amount: prize.amount,
          available,
        });
      }
    }

    return positions;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  if (!submission) {
    return null;
  }

  const availablePositions = getAvailablePositions();

  return (
    <>
      {/* <Header 
        pages={['Bounties', submission.bounty.title, 'Submissions', submission.title || 'Submission']} 
        page="Review Submission" 
      /> */}
      <div className="mt-4 flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mb-4 flex items-center justify-between">
          <Button
            className="text-white/60 hover:text-white"
            onClick={() => router.push(`/bounties/${id}/submissions`)}
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bounty
          </Button>
          <Badge className={`${getStatusColor(submission.status)} border-0`}>
            {submission.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Submission Header */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-2xl text-white">
                  {submission.title || "Untitled Submission"}
                </CardTitle>
                <CardDescription className="text-white/60">
                  Submitted on {formatDate(submission.submittedAt)}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Submission Content */}
            {submission.description && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert prose-pink max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {submission.description}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* External Submission Link */}
            {submission.submissionUrl && (
              <Card className="gap-0 border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">Submission Link</CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    className="flex items-center gap-2 text-[#E6007A] hover:underline"
                    href={submission.submissionUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {submission.submissionUrl}
                  </a>
                </CardContent>
              </Card>
            )}

            {/* Screening Questions */}
            {submission.answers && submission.answers.length > 0 && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">
                    Screening Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submission.answers.map((answer, index) => (
                    <div className="space-y-2" key={index}>
                      <p className="font-medium text-sm text-white/80">
                        {answer.question}
                      </p>
                      {answer.type === "url" ? (
                        <a
                          className="flex items-center gap-2 text-[#E6007A] hover:underline"
                          href={answer.answer}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {answer.answer}
                        </a>
                      ) : (
                        <p className="text-white/60">{answer.answer}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Attached Files */}
            {submission.files && submission.files.length > 0 && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">Attached Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {submission.files.map((file, index) => (
                      <a
                        className="flex items-center gap-3 rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
                        href={file.url}
                        key={index}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <FileText className="h-5 w-5 text-white/60" />
                        <div className="flex-1">
                          <p className="font-medium text-white">{file.name}</p>
                          <p className="text-sm text-white/40">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Download className="h-4 w-4 text-white/60" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review Actions */}
            {submission.status === "SUBMITTED" && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">Review Decision</CardTitle>
                  <CardDescription className="text-white/60">
                    Select this submission as a winner or provide feedback
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Winner Position Selection */}
                  <div>
                    <Label>Winner Position</Label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {availablePositions.map((pos) => (
                        <button
                          className={`rounded-lg border p-4 transition-all ${
                            selectedPosition === pos.position
                              ? "border-[#E6007A] bg-[#E6007A]/20 text-white"
                              : pos.available
                                ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                                : "cursor-not-allowed border-white/10 bg-white/5 text-white/40"
                          }`}
                          disabled={!pos.available}
                          key={pos.position}
                          onClick={() =>
                            pos.available && setSelectedPosition(pos.position)
                          }
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              Position #{pos.position}
                            </span>
                            <Trophy className="h-4 w-4" />
                          </div>
                          <div className="mt-1 text-sm">
                            {formatAmount(pos.amount)} {submission.bounty.token}
                          </div>
                          {!pos.available && (
                            <div className="mt-1 text-white/40 text-xs">
                              Already taken
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="feedback">
                      Feedback (Required for rejection)
                    </Label>
                    <Textarea
                      className="mt-2 border-white/10 bg-white/5 text-white"
                      id="feedback"
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Provide constructive feedback for the submitter..."
                      rows={4}
                      value={feedback}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      disabled={actionLoading || selectedPosition === null}
                      onClick={() => handleStatusUpdate("APPROVED")}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Select as Winner
                    </Button>
                    <Button
                      disabled={actionLoading}
                      onClick={() => handleStatusUpdate("REJECTED")}
                      variant="destructive"
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-2 h-4 w-4" />
                      )}
                      Reject Submission
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Previous Decision */}
            {(submission.status === "APPROVED" ||
              submission.status === "REJECTED") &&
              submission.feedback && (
                <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Review Decision
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Reviewed on{" "}
                      {submission.reviewedAt
                        ? formatDate(submission.reviewedAt)
                        : "N/A"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80">{submission.feedback}</p>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Submitter Info */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">Submitter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  {submission.creator.image ? (
                    <img
                      alt={submission.creator.username}
                      className="h-12 w-12 rounded-full"
                      src={submission.creator.image}
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#E6007A] to-purple-600 font-bold text-white">
                      {submission.creator.username[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-white">
                      {submission.creator.firstName}{" "}
                      {submission.creator.lastName}
                    </p>
                    <p className="text-sm text-white/60">
                      @{submission.creator.username}
                    </p>
                  </div>
                </div>

                {submission.creator.bio && (
                  <div>
                    <p className="mb-1 text-sm text-white/60">Bio</p>
                    <p className="text-sm text-white/80">
                      {submission.creator.bio}
                    </p>
                  </div>
                )}

                {submission.creator.location && (
                  <div className="flex items-center gap-2 text-white/60">
                    <User className="h-4 w-4" />
                    <span className="text-sm">
                      {submission.creator.location}
                    </span>
                  </div>
                )}

                {submission.creator.email && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Mail className="h-4 w-4" />
                    <a
                      className="text-sm hover:text-white"
                      href={`mailto:${submission.creator.email}`}
                    >
                      {submission.creator.email}
                    </a>
                  </div>
                )}

                {submission.creator.skills &&
                  Array.isArray(submission.creator.skills) &&
                  submission.creator.skills.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm text-white/60">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {submission.creator.skills.map((skill: string) => (
                          <Badge
                            className="border-0 bg-white/10 text-white"
                            key={skill}
                            variant="secondary"
                          >
                            {getSkillLabel(skill)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="space-y-2 pt-2">
                  {submission.creator.github && (
                    <a
                      className="flex items-center gap-2 text-[#E6007A] text-sm hover:underline"
                      href={
                        submission.creator.github.startsWith("http")
                          ? submission.creator.github
                          : `https://github.com/${submission.creator.github}`
                      }
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                      GitHub Profile
                    </a>
                  )}
                  {submission.creator.linkedin && (
                    <a
                      className="flex items-center gap-2 text-[#E6007A] text-sm hover:underline"
                      href={
                        submission.creator.linkedin.startsWith("http")
                          ? submission.creator.linkedin
                          : `https://linkedin.com/in/${submission.creator.linkedin}`
                      }
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                      LinkedIn Profile
                    </a>
                  )}
                  {submission.creator.twitter && (
                    <a
                      className="flex items-center gap-2 text-[#E6007A] text-sm hover:underline"
                      href={
                        submission.creator.twitter.startsWith("http")
                          ? submission.creator.twitter
                          : `https://twitter.com/${submission.creator.twitter}`
                      }
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Twitter Profile
                    </a>
                  )}
                  {submission.creator.website && (
                    <a
                      className="flex items-center gap-2 text-[#E6007A] text-sm hover:underline"
                      href={
                        submission.creator.website.startsWith("http")
                          ? submission.creator.website
                          : `https://${submission.creator.website}`
                      }
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bounty Info */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">Bounty Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-white/60" />
                  <div>
                    <p className="text-sm text-white/60">Total Prize Pool</p>
                    <p className="font-medium text-white">
                      {formatAmount(submission.bounty.totalAmount)}{" "}
                      {submission.bounty.token}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-white/60" />
                  <div>
                    <p className="text-sm text-white/60">Winners</p>
                    <p className="text-white">
                      {submission.bounty.winnerCount} positions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/60" />
                  <div>
                    <p className="text-sm text-white/60">Submitted</p>
                    <p className="text-white">
                      {formatDate(submission.submittedAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
