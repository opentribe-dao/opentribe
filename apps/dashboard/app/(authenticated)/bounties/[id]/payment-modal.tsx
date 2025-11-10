"use client";

import { Alert, AlertDescription } from "@packages/base/components/ui/alert";
import { Button } from "@packages/base/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@packages/base/components/ui/dialog";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import { AlertCircle, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { useBountyContext } from "@/app/(authenticated)/components/bounty-provider";

export function PaymentModal() {
  const {
    bounty,
    paymentModalOpen,
    setPaymentModalOpen,
    selectedPaymentSubmission,
    transactionId,
    setTransactionId,
    isSubmittingPayment,
    isVerifyingPayment,
    verificationStatus,
    verificationMessage,
    verifyPayment,
    recordPayment,
    resetPaymentState,
  } = useBountyContext();

  const onClose = () => {
    setPaymentModalOpen(false);
    resetPaymentState();
  };

  if (!(bounty && selectedPaymentSubmission)) {
    return null;
  }

  const submission = {
    id: selectedPaymentSubmission.id,
    submitter: {
      firstName: (selectedPaymentSubmission as any)?.submitter?.firstName,
      username: (selectedPaymentSubmission as any)?.submitter?.username,
      walletAddress: (selectedPaymentSubmission as any)?.submitter
        ?.walletAddress,
    },
    position: (selectedPaymentSubmission as any)?.position,
    winningAmount: (selectedPaymentSubmission as any)?.winningAmount,
  };

  return (
    <Dialog onOpenChange={onClose} open={paymentModalOpen}>
      <DialogContent className="max-w-md border-white/10 bg-zinc-900 text-white">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription className="text-white/60">
            Record the payment transaction for{" "}
            {submission.submitter.firstName ||
              submission.submitter.username ||
              "this winner"}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
          <div className="space-y-2 rounded-lg bg-white/5 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Recipient</span>
              <span className="font-medium">
                {submission.submitter.firstName ||
                  submission.submitter.username}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Position</span>
              <span className="font-medium">
                {submission.position === 1
                  ? "1st"
                  : submission.position === 2
                    ? "2nd"
                    : submission.position === 3
                      ? "3rd"
                      : `${submission.position}th`}{" "}
                Place
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Amount</span>
              <span className="font-medium">
                {submission.winningAmount} {bounty.token}
              </span>
            </div>
            {submission.submitter.walletAddress && (
              <div className="border-white/10 border-t pt-2">
                <p className="mb-1 text-white/60 text-xs">Payment Address</p>
                <p className="break-all font-mono text-xs">
                  {submission.submitter.walletAddress}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionId">
              Transaction ID (Extrinsic Hash)
            </Label>
            <div className="flex gap-2">
              <Input
                className="border-white/10 bg-white/5 font-mono text-sm text-white"
                id="transactionId"
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="0x..."
                value={transactionId}
              />
              <Button
                className="border-white/20 text-white hover:bg-white/10"
                disabled={!transactionId || isVerifyingPayment}
                onClick={verifyPayment}
                size="sm"
                type="button"
                variant="outline"
              >
                {isVerifyingPayment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
            <p className="text-white/40 text-xs">
              Enter the transaction hash from your Polkadot wallet
            </p>
          </div>

          {verificationStatus !== "idle" && (
            <Alert
              className={`border ${
                verificationStatus === "success"
                  ? "border-green-500/50 bg-green-500/10"
                  : "border-red-500/50 bg-red-500/10"
              }`}
            >
              {verificationStatus === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription
                className={
                  verificationStatus === "success"
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {verificationMessage}
              </AlertDescription>
            </Alert>
          )}

          {transactionId && (
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <span>View on Subscan:</span>
              <a
                className="flex items-center gap-1 text-[#E6007A] hover:underline"
                href={`https://polkadot.subscan.io/extrinsic/${transactionId}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open in Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            className="border-white/20 text-white hover:bg-white/10"
            onClick={onClose}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
            disabled={
              !transactionId ||
              isSubmittingPayment ||
              verificationStatus === "idle" ||
              verificationStatus === "error"
            }
            onClick={recordPayment}
          >
            {isSubmittingPayment ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              "Record Payment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
