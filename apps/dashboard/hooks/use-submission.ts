"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { env } from "@/env";

export type SubmissionDetails = {
  id: string;
  title?: string;
  description?: string;
  submissionUrl?: string;
  status: string;
  position: number | null;
  winningAmount: number | null;
  submittedAt: string;
  reviewedAt?: string;
  feedback?: string;
  answers?: Array<{
    question: string;
    answer: string;
    type: string;
  }>;
  files?: Array<{
    name: string;
    url: string;
    size: number;
  }>;
  bounty: {
    id: string;
    title: string;
    organizationId: string;
    winnerCount: number;
    totalAmount: number;
    token: string;
    winnings: Array<{
      position: number;
      amount: number;
    }>;
    submissions: Array<{
      id: string;
      status: string;
    }>;
  };
  creator: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    image?: string;
    location?: string;
    bio?: string;
    skills?: string[];
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
}

export function useSubmission() {
  const [submission, setSubmission] = useState<SubmissionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);

  const fetchSubmissionDetails = useCallback(
    async (bountyId: string, submissionId: string) => {
      try {
        setLoading(true);
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bountyId}/submissions/${submissionId}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch submission details");
        }

        const data = await response.json();
        setSubmission(data.submission);
        setFeedback(data.submission.feedback || "");
        return data.submission;
      } catch (error) {
        console.error("Error fetching submission:", error);
        toast.error("Failed to load submission details");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const assignPosition = useCallback(
    async (bountyId: string, submissionId: string, position: number | null) => {
      try {
        setActionLoading(true);
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bountyId}/submissions/${submissionId}/position`,
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ position }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to assign position");
        }

        toast.success(
          position
            ? `Position ${position} assigned successfully`
            : "Position cleared successfully"
        );
        return true;
      } catch (error) {
        console.error("Error assigning position:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to assign position";
        toast.error(errorMessage);
        throw error;
      } finally {
        setActionLoading(false);
      }
    },
    []
  );

  const markSubmissionAsSpam = useCallback(
    async (bountyId: string, submissionId: string) => {
      try {
        setActionLoading(true);
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bountyId}/submissions/${submissionId}/review`,
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "SPAM" }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (
            response.status === 400 &&
            errorData.error?.includes("winner")
          ) {
            throw new Error(
              "Cannot mark winner as SPAM. Clear position first."
            );
          }
          throw new Error(errorData.error || "Failed to mark submission as SPAM");
        }

        toast.success("Submission marked as SPAM");
        return true;
      } catch (error) {
        console.error("Error marking submission as SPAM:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to mark submission as SPAM";
        toast.error(errorMessage);
        throw error;
      } finally {
        setActionLoading(false);
      }
    },
    []
  );

  const unmarkSubmissionAsSpam = useCallback(
    async (bountyId: string, submissionId: string) => {
      try {
        setActionLoading(true);
        const response = await fetch(
          `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bountyId}/submissions/${submissionId}/review`,
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "SUBMITTED", action: "CLEAR_SPAM" }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to unmark submission as SPAM");
        }

        toast.success("Submission unmarked as SPAM");
        return true;
      } catch (error) {
        console.error("Error unmarking submission as SPAM:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to unmark submission as SPAM";
        toast.error(errorMessage);
        throw error;
      } finally {
        setActionLoading(false);
      }
    },
    []
  );

  const resetSubmissionState = useCallback(() => {
    setSubmission(null);
    setFeedback("");
    setSelectedPosition(null);
    setLoading(false);
    setActionLoading(false);
  }, []);

  return {
    submission,
    loading,
    actionLoading,
    feedback,
    setFeedback,
    selectedPosition,
    setSelectedPosition,
    fetchSubmissionDetails,
    assignPosition,
    markSubmissionAsSpam,
    unmarkSubmissionAsSpam,
    resetSubmissionState,
  };
}
