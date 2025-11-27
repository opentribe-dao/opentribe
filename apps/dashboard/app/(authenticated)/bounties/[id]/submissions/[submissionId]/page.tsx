"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@packages/base/components/ui/alert-dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@packages/base/components/ui/tooltip";
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
import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
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

  const {
    currentSubmission: submission,
    submissionLoading: loading,
    submissionActionLoading: actionLoading,
    selectedPosition,
    setSelectedPosition,
    fetchSubmissionDetails,
    assignPosition,
    markSubmissionAsSpam,
    unmarkSubmissionAsSpam,
    refreshSubmissions,
    selectedWinners,
    setSelectedWinners,
  } = useBountyContext();

  useEffect(() => {
    if (id && submissionId) {
      fetchSubmissionDetails(id, submissionId);
    }
  }, [id, submissionId, fetchSubmissionDetails]);

  // State for position reassignment confirmation dialog
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<number | null>(null);
  const [conflictingSubmission, setConflictingSubmission] = useState<{
    id: string;
    username: string;
  } | null>(null);

  // State for SPAM confirmation dialog
  const [showSpamDialog, setShowSpamDialog] = useState(false);

  const handleSelectWinner = (
    targetSubmissionId: string,
    winnerPosition: number,
    amount: string,
    username: string
  ) => {
    const newSelected = new Map(selectedWinners);

    // Check if this submission is already selected
    if (newSelected.has(targetSubmissionId)) {
      newSelected.delete(targetSubmissionId);
    } else {
      // Remove any other submission with the same position
      for (const [subId, data] of newSelected) {
        if (data.position === winnerPosition) {
          newSelected.delete(subId);
        }
      }
      newSelected.set(targetSubmissionId, { position: winnerPosition, amount, username });
    }

    setSelectedWinners(newSelected);
  };

  /**
   * Handles position assignment with confirmation dialog if position is already taken.
   * 
   * This function checks if the selected position is already assigned to another submission.
   * If it is, shows a confirmation dialog before reassigning. Otherwise, assigns directly.
   * 
   * Note: Winners are determined by position assignment ONLY, not by submission status.
   * The status field remains unchanged during position assignment.
   */
  const handlePositionAssignment = async (assignedPosition: number | null) => {
    // If clearing position, no confirmation needed
    if (assignedPosition === null) {
      try {
        await assignPosition(id, submissionId, null);
        setSelectedPosition(null);
        router.back();
        refreshSubmissions();
      } catch {
        // Error handling is done in the hook
      }
      return;
    }

    // Check if position is already assigned to another submission
    const conflictingWinner = Array.from(selectedWinners.entries()).find(
      ([subId, data]) => subId !== submissionId && data.position === assignedPosition
    ) as [string, { position: number; amount: string; username: string }] | undefined;

    if (conflictingWinner) {
      // Position is already taken - show confirmation dialog
      const [conflictingId, conflictingData] = conflictingWinner;
      setConflictingSubmission({
        id: conflictingId,
        username: conflictingData.username,
      });
      setPendingPosition(assignedPosition);
      setShowReassignDialog(true);
    } else {
      // Position is available - assign directly
      try {
        await assignPosition(id, submissionId, assignedPosition);
        handleSelectWinner(
          submissionId,
          assignedPosition,
          "",
          submission?.creator.username ?? ""
        );
        setSelectedPosition(null);
        router.back();
        refreshSubmissions();
      } catch {
        // Error handling is done in the hook
      }
    }
  };

  /**
   * Confirms position reassignment after user approves in dialog.
   */
  const confirmPositionReassignment = async () => {
    if (pendingPosition === null) {
      return;
    }

    try {
      await assignPosition(id, submissionId, pendingPosition);
      handleSelectWinner(
        submissionId,
        pendingPosition,
        "",
        submission?.creator.username ?? ""
      );
      setSelectedPosition(null);
      setShowReassignDialog(false);
      setPendingPosition(null);
      setConflictingSubmission(null);
      router.back();
      refreshSubmissions();
    } catch {
      // Error handling is done in the hook
      setShowReassignDialog(false);
      setPendingPosition(null);
      setConflictingSubmission(null);
    }
  };

  /**
   * Handles marking a submission as SPAM.
   * 
   * Important: Winners (submissions with assigned positions) cannot be marked as SPAM.
   * The position must be cleared first. This prevents accidental marking of winners.
   * 
   * SPAM status replaces the old REJECTED status and is used for inappropriate/spam submissions.
   */
  const handleMarkAsSpam = () => {
    // Check if submission is a winner (has position)
    if (submission?.position != null) {
      toast.error(
        "Cannot mark winners as SPAM. Please clear the position first."
      );
      return;
    }

    // Show confirmation dialog
    setShowSpamDialog(true);
  };

  const confirmMarkAsSpam = async () => {
    setShowSpamDialog(false);
    try {
      await markSubmissionAsSpam(id, submissionId);
      router.back();
      refreshSubmissions();
    } catch {
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
      case "SPAM":
        return "bg-red-500/20 text-red-400";
      case "WITHDRAWN":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-white/10 text-white/60";
    }
  };

  /**
   * Gets available positions for assignment.
   * 
   * Positions are determined by:
   * 1. Must exist in bounty.winnings structure
   * 2. Must be between 1 and bounty.winnerCount
   * 3. Must not be already assigned to another submission
   * 
   * This function validates positions on the frontend to provide immediate feedback
   * before API validation. The API also validates positions independently.
   */
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
    // Only include positions that exist in winnings structure and are within winnerCount range
    const availablePositionsList: Array<{
      position: number;
      amount: number;
      available: boolean;
    }> = [];
    for (let i = 1; i <= submission.bounty.winnerCount; i++) {
      const prize = submission.bounty.winnings.find((w) => w.position === i);
      if (prize) {
        // If the position is not taken, it's available
        const available = !takenPositions.has(i);
        availablePositionsList.push({
          position: i,
          amount: prize.amount,
          available,
        });
      }
    }

    return availablePositionsList;
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
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(submission.status)} border-0`}>
              {submission.status}
            </Badge>
            {/* {submission.position !== null && (
              <Badge className="bg-green-500/20 text-green-400 border-0">
                Winner - Position #{submission.position}
              </Badge>
            )} */}
          </div>
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
                  {submission.answers.map((answer) => (
                    <div className="space-y-2" key={`${answer.question}-${answer.answer}`}>
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
                    {submission.files.map((file) => (
                      <a
                        className="flex items-center gap-3 rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
                        href={file.url}
                        key={file.url}
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

            {/* Position Assignment & SPAM Actions */}
            {submission.status === "SUBMITTED" && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">Assign Winner Position</CardTitle>
                  <CardDescription className="text-white/60">
                    {submission.position
                      ? `Currently assigned to position ${submission.position}`
                      : "Select a position to assign this submission as a winner"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Winner Position Selection */}
                  <div>
                    <Label>Winner Position</Label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {availablePositions.map((pos) => {
                        const isSelected =
                          selectedPosition === pos.position ||
                          submission.position === pos.position;
                        let buttonClasses = "rounded-lg border p-4 transition-all";
                        if (isSelected) {
                          buttonClasses +=
                            " border-[#E6007A] bg-[#E6007A]/20 text-white";
                        } else if (pos.available) {
                          buttonClasses +=
                            " border-white/10 bg-white/5 text-white hover:bg-white/10";
                        } else {
                          buttonClasses +=
                            " cursor-not-allowed border-white/10 bg-white/5 text-white/40";
                        }
                        return (
                          <button
                            type="button"
                            className={buttonClasses}
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
                          {submission.position === pos.position && (
                            <div className="mt-1 text-white/80 text-xs">
                              Current position
                            </div>
                          )}
                          {!pos.available && submission.position !== pos.position && (
                            <div className="mt-1 text-white/40 text-xs">
                              Already taken
                            </div>
                          )}
                        </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="bg-[#E6007A] hover:bg-[#E6007A]/90"
                      disabled={actionLoading || selectedPosition === null}
                      onClick={() => handlePositionAssignment(selectedPosition)}
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Save Position
                    </Button>
                    {submission.position !== null && (
                      <Button
                        className="border-white/20 text-white hover:bg-white/10"
                        disabled={actionLoading}
                        onClick={() => handlePositionAssignment(null)}
                        variant="outline"
                      >
                        {actionLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <X className="mr-2 h-4 w-4" />
                        )}
                        Clear Position
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SPAM Marking */}
            {submission.status === "SUBMITTED" && (
              <Card className="border-white/10 bg-white/5 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-white">Mark as SPAM</CardTitle>
                  <CardDescription className="text-white/60">
                    Mark this submission as SPAM if it's inappropriate or spam
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          className="bg-red-600 hover:bg-red-700"
                          disabled={actionLoading || submission.position !== null}
                          onClick={handleMarkAsSpam}
                          variant="destructive"
                        >
                          {actionLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <X className="mr-2 h-4 w-4" />
                          )}
                          { "Mark as SPAM"}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {submission.position !== null && (
                      <TooltipContent>
                        <p>Cannot mark winners as SPAM. Clear position first.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </CardContent>
              </Card>
            )}

            {/* Winner Badge */}
            {/* {submission.position !== null && (
              <Card className="border-green-500/30 bg-green-500/10 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Trophy className="h-5 w-5 text-green-400" />
                    Winner - Position #{submission.position}
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    {submission.winningAmount && (
                      <>
                        Winning amount: {formatAmount(Number(submission.winningAmount))}{" "}
                        {submission.bounty.token}
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            )} */}

            {/* SPAM Badge and Unmark Button */}
            {submission.status === "SPAM" && (
              <Card className="border-red-500/30 bg-red-500/10 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <X className="h-5 w-5 text-red-400" />
                    Marked as SPAM
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    This submission has been marked as SPAM
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    disabled={actionLoading}
                    onClick={async () => {
                      try {
                        await unmarkSubmissionAsSpam(id, submissionId);
                        router.back();
                        refreshSubmissions();
                      } catch {
                        // Error handling is done in the hook
                      }
                    }}
                    variant="default"
                  >
                    {actionLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Not Spam
                  </Button>
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
                    <Image
                      alt={submission.creator.username}
                      className="h-12 w-12 rounded-full"
                      height={48}
                      src={submission.creator.image}
                      width={48}
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

      {/* Position Reassignment Confirmation Dialog */}
      <AlertDialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <AlertDialogContent className="border-white/10 bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Reassign Position {pendingPosition}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Position {pendingPosition} is already assigned to{" "}
              {conflictingSubmission?.username || "another submission"}. Reassigning
              will clear the position from that submission and assign it to this one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPositionReassignment}
              className="bg-[#E6007A] hover:bg-[#E6007A]/90"
            >
              Reassign Position
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SPAM Confirmation Dialog */}
      <AlertDialog onOpenChange={setShowSpamDialog} open={showSpamDialog}>
        <AlertDialogContent className="border-white/10 bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Mark as SPAM?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to mark this submission as SPAM? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMarkAsSpam}
              className="bg-red-600 hover:bg-red-700"
            >
              Mark as SPAM
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
