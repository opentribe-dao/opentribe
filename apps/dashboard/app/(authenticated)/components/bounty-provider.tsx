"use client";

import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";
import { toast } from "sonner";
import { env } from "@/env";
import {
  type BountyDetails,
  type Submission,
  useBounty,
  useBountySubmissions,
} from "@/hooks/use-bounty";
import { type SubmissionDetails, useSubmission } from "@/hooks/use-submission";

type VerificationStatus = "idle" | "success" | "error";

interface BountyContextType {
  bounty: BountyDetails | undefined;
  bountyLoading: boolean;
  bountyError: Error | null;
  refreshBounty: () => void;

  submissions: Submission[];
  submissionsLoading: boolean;
  submissionsError: Error | null;
  refreshSubmissions: () => void;

  selectedWinners: Map<
    string,
    { position: number; amount: string; username: string }
  >;
  setSelectedWinners: (
    winners: Map<string, { position: number; amount: string; username: string }>
  ) => void;
  clearSelectedWinners: () => void;

  announceWinners: () => Promise<void>;
  isAnnouncing: boolean;
  isResetingWinners: boolean;

  paymentModalOpen: boolean;
  setPaymentModalOpen: (open: boolean) => void;

  selectedPaymentSubmission: Submission | null;
  setSelectedPaymentSubmission: (submission: Submission | null) => void;

  transactionId: string;
  setTransactionId: (id: string) => void;
  isSubmittingPayment: boolean;
  isVerifyingPayment: boolean;
  verificationStatus: VerificationStatus;
  verificationMessage: string;
  verifyPayment: () => Promise<void>;
  recordPayment: () => Promise<void>;
  resetPaymentState: () => void;

  // Submission state
  currentSubmission: SubmissionDetails | null;
  submissionLoading: boolean;
  submissionActionLoading: boolean;
  submissionFeedback: string;
  setSubmissionFeedback: (feedback: string) => void;
  selectedPosition: number | null;
  setSelectedPosition: (position: number | null) => void;
  fetchSubmissionDetails: (
    bountyId: string,
    submissionId: string
  ) => Promise<any>;
  assignPosition: (
    bountyId: string,
    submissionId: string,
    position: number | null
  ) => Promise<boolean>;
  markSubmissionAsSpam: (
    bountyId: string,
    submissionId: string
  ) => Promise<boolean>;
  resetSubmissionState: () => void;
  resetWinners: () => Promise<void>;
}

const BountyContext = createContext<BountyContextType | null>(null);

export function BountyProvider({
  children,
  bountyId,
}: {
  children: React.ReactNode;
  bountyId: string;
}) {
  // Bounty data via react-query
  const {
    data: bounty,
    isLoading: bountyLoading,
    error: bountyError,
    refetch: refreshBounty,
  } = useBounty(bountyId);

  // Submissions data via react-query
  const {
    data: submissions = [],
    isLoading: submissionsLoading,
    error: submissionsError,
    refetch: refreshSubmissions,
  } = useBountySubmissions(bountyId);

  // Submission hook
  const {
    submission: currentSubmission,
    loading: submissionLoading,
    actionLoading: submissionActionLoading,
    feedback: submissionFeedback,
    setFeedback: setSubmissionFeedback,
    selectedPosition,
    setSelectedPosition,
    fetchSubmissionDetails,
    assignPosition,
    markSubmissionAsSpam,
    resetSubmissionState,
  } = useSubmission();

  // Winner selection state
  const [selectedWinners, setSelectedWinners] = useState<
    Map<string, { position: number; amount: string; username: string }>
  >(new Map());
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [isResetingWinners, setIsResetingWinners] = useState(false);

  // Payment modal & selection state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentSubmission, setSelectedPaymentSubmission] =
    useState<Submission | null>(null);

  // Payment flow state
  const [transactionId, _setTransactionId] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("idle");
  const [verificationMessage, setVerificationMessage] = useState("");

  const resetPaymentState = useCallback(() => {
    _setTransactionId("");
    setIsSubmittingPayment(false);
    setIsVerifyingPayment(false);
    setVerificationStatus("idle");
    setVerificationMessage("");
  }, []);

  const setTransactionId = useCallback((id: string) => {
    _setTransactionId(id);
    setVerificationStatus("idle");
    setVerificationMessage("");
  }, []);

  // Announce winners function
  const announceWinners = useCallback(async () => {
    if (selectedWinners.size === 0) {
      toast.error("Please select at least one winner");
      return;
    }
    setIsAnnouncing(true);
    try {
      const winners = Array.from(selectedWinners.entries()).map(
        ([submissionId, data]) => ({
          submissionId,
          position: data.position,
          amount: Number(data.amount),
        })
      );
      const res = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bountyId}/winners`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ winners }),
        }
      );
      if (!res.ok) {
        throw new Error("Failed to announce winners");
      }
      toast.success("Winners announced successfully!");
      setSelectedWinners(new Map());
      refreshBounty();
      refreshSubmissions();
    } catch {
      toast.error("Failed to announce winners");
    } finally {
      setIsAnnouncing(false);
    }
  }, [selectedWinners, bountyId, refreshBounty, refreshSubmissions]);

  const resetWinners = useCallback(async () => {
    try {
      // setActionLoading(true);
      setIsResetingWinners(true);
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bountyId}/winners/reset`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to removed selected winners");
      }
      setSelectedWinners(new Map());
      refreshSubmissions();

      toast.success("Winners removed successfully");
    } catch (error) {
      toast.error("Failed to remove selected winners");
      throw error;
    } finally {
      setIsResetingWinners(false);
    }
  }, [bountyId, refreshSubmissions]);

  // Verify payment via blockchain
  const verifyPayment = useCallback(async () => {
    if (
      !(transactionId && selectedPaymentSubmission?.submitter?.walletAddress)
    ) {
      return;
    }

    setIsVerifyingPayment(true);
    setVerificationStatus("idle");
    setVerificationMessage("");

    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/payments/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            extrinsicHash: transactionId,
            expectedTo: selectedPaymentSubmission.submitter.walletAddress,
            expectedAmount: selectedPaymentSubmission.winningAmount,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.verified) {
        setVerificationStatus("success");
        setVerificationMessage(
          "Transaction verified successfully on the blockchain!"
        );
      } else {
        setVerificationStatus("error");
        setVerificationMessage(
          data.error ||
            "Could not verify transaction. Please check the transaction ID."
        );
      }
    } catch {
      setVerificationStatus("error");
      setVerificationMessage("Failed to verify transaction. Please try again.");
    } finally {
      setIsVerifyingPayment(false);
    }
  }, [transactionId, selectedPaymentSubmission]);

  // Record payment
  const recordPayment = useCallback(async () => {
    if (!(bounty && selectedPaymentSubmission)) {
      return;
    }
    if (!transactionId) {
      toast.error("Please enter a transaction ID");
      return;
    }

    setIsSubmittingPayment(true);

    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bounty.id}/payments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            submissionId: selectedPaymentSubmission.id,
            extrinsicHash: transactionId,
            amount: selectedPaymentSubmission.winningAmount,
            token: bounty.token,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to record payment");
      }

      toast.success("Payment recorded successfully!");
      // Refresh data and close modal
      await Promise.all([refreshBounty(), refreshSubmissions()]);
      setPaymentModalOpen(false);
      setSelectedPaymentSubmission(null);
      resetPaymentState();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to record payment"
      );
    } finally {
      setIsSubmittingPayment(false);
    }
  }, [
    bounty,
    selectedPaymentSubmission,
    transactionId,
    refreshBounty,
    refreshSubmissions,
    resetPaymentState,
  ]);

  return (
    <BountyContext.Provider
      value={{
        bounty,
        bountyLoading,
        bountyError: bountyError as Error | null,
        refreshBounty,
        submissions: Array.isArray(submissions) ? submissions : [],
        submissionsLoading,
        submissionsError: submissionsError as Error | null,
        refreshSubmissions,
        selectedWinners,
        setSelectedWinners,
        clearSelectedWinners: () => setSelectedWinners(new Map()),
        announceWinners,
        isAnnouncing,
        isResetingWinners,
        paymentModalOpen,
        setPaymentModalOpen,
        selectedPaymentSubmission,
        setSelectedPaymentSubmission,
        transactionId,
        setTransactionId,
        isSubmittingPayment,
        isVerifyingPayment,
        verificationStatus,
        verificationMessage,
        verifyPayment,
        recordPayment,
        resetPaymentState,
        currentSubmission,
        submissionLoading,
        submissionActionLoading,
        submissionFeedback,
        setSubmissionFeedback,
        selectedPosition,
        setSelectedPosition,
        fetchSubmissionDetails,
        assignPosition,
        markSubmissionAsSpam,
        resetSubmissionState,
        resetWinners,
      }}
    >
      {children}
    </BountyContext.Provider>
  );
}

export function useBountyContext() {
  const ctx = useContext(BountyContext);
  if (!ctx) {
    throw new Error("useBountyContext must be used within a BountyProvider");
  }
  return ctx;
}
