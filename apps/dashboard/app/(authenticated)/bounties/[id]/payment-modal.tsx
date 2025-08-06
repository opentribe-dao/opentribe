'use client';

import { useState } from 'react';
import { Button } from '@packages/base/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@packages/base/components/ui/dialog';
import { Input } from '@packages/base/components/ui/input';
import { Label } from '@packages/base/components/ui/label';
import { Alert, AlertDescription } from '@packages/base/components/ui/alert';
import { Loader2, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { env } from '@/env';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: {
    id: string;
    submitter: {
      firstName?: string;
      username?: string;
      walletAddress?: string;
    };
    position?: number;
    winningAmount?: number;
  };
  bounty: {
    id: string;
    title: string;
    token: string;
  };
  onPaymentRecorded: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  submission,
  bounty,
  onPaymentRecorded,
}: PaymentModalProps) {
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verificationMessage, setVerificationMessage] = useState('');

  const handleVerifyTransaction = async () => {
    if (!transactionId || !submission.submitter.walletAddress) return;

    setIsVerifying(true);
    setVerificationStatus('idle');
    setVerificationMessage('');

    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/payments/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            extrinsicHash: transactionId,
            expectedTo: submission.submitter.walletAddress,
            expectedAmount: submission.winningAmount?.toString(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.verified) {
        setVerificationStatus('success');
        setVerificationMessage('Transaction verified successfully on the blockchain!');
      } else {
        setVerificationStatus('error');
        setVerificationMessage(data.error || 'Could not verify transaction. Please check the transaction ID.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      setVerificationMessage('Failed to verify transaction. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!transactionId) {
      toast.error('Please enter a transaction ID');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_API_URL}/api/v1/bounties/${bounty.id}/payments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            submissionId: submission.id,
            extrinsicHash: transactionId,
            amount: Number(submission.winningAmount),
            token: bounty.token,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record payment');
      }

      toast.success('Payment recorded successfully!');
      onPaymentRecorded();
      onClose();
    } catch (error) {
      console.error('Payment recording error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription className="text-white/60">
            Record the payment transaction for {submission.submitter.firstName || submission.submitter.username || 'this winner'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {/* Payment Details */}
          <div className="p-4 bg-white/5 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Recipient</span>
              <span className="font-medium">{submission.submitter.firstName || submission.submitter.username}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Position</span>
              <span className="font-medium">
                {submission.position === 1 ? '1st' : 
                 submission.position === 2 ? '2nd' : 
                 submission.position === 3 ? '3rd' : 
                 `${submission.position}th`} Place
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Amount</span>
              <span className="font-medium">{submission.winningAmount} {bounty.token}</span>
            </div>
            {submission.submitter.walletAddress && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-white/60 mb-1">Payment Address</p>
                <p className="text-xs font-mono break-all">{submission.submitter.walletAddress}</p>
              </div>
            )}
          </div>

          {/* Transaction ID Input */}
          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction ID (Extrinsic Hash)</Label>
            <div className="flex gap-2">
              <Input
                id="transactionId"
                value={transactionId}
                onChange={(e) => {
                  setTransactionId(e.target.value);
                  setVerificationStatus('idle');
                  setVerificationMessage('');
                }}
                placeholder="0x..."
                className="bg-white/5 border-white/10 text-white font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleVerifyTransaction}
                disabled={!transactionId || isVerifying}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
            <p className="text-xs text-white/40">
              Enter the transaction hash from your Polkadot wallet
            </p>
          </div>

          {/* Verification Status */}
          {verificationStatus !== 'idle' && (
            <Alert className={`border ${
              verificationStatus === 'success' ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'
            }`}>
              {verificationStatus === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription className={
                verificationStatus === 'success' ? 'text-green-400' : 'text-red-400'
              }>
                {verificationMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Subscan Link */}
          {transactionId && (
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span>View on Subscan:</span>
              <a
                href={`https://polkadot.subscan.io/extrinsic/${transactionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E6007A] hover:underline flex items-center gap-1"
              >
                Open in Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!transactionId || isSubmitting}
            className="bg-[#E6007A] hover:bg-[#E6007A]/90 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Recording...
              </>
            ) : (
              'Record Payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}