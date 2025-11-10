"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { env } from "@/env";

export interface SubmissionDetails {
  id: string;
  title?: string;
  description?: string;
  submissionUrl?: string;
  status: string;
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

  const updateSubmissionStatus = useCallback(
    async (
      bountyId: string,
      submissionId: string,
      newStatus: "APPROVED" | "REJECTED",
      feedback?: string,
      position?: number
    ) => {
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
            body: JSON.stringify({
              status: newStatus,
              feedback: feedback || undefined,
              position: newStatus === "APPROVED" ? position : undefined,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update submission status");
        }

        toast.success(`Submission ${newStatus.toLowerCase()} successfully`);
        return true;
      } catch (error) {
        console.error("Error updating submission:", error);
        toast.error("Failed to update submission status");
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
    updateSubmissionStatus,
    resetSubmissionState,
  };
}
