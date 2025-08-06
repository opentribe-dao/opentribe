import { PolkadotClient } from './blockchain';
import { isValidPolkadotAddress, formatPolkadotAddress } from './address';
import type { PaymentRecord, PaymentStatus, NetworkName } from './types';

export interface PaymentVerificationResult {
  verified: boolean;
  status: PaymentStatus;
  details?: {
    blockNumber: number;
    timestamp: number;
    actualAmount: string;
    fee: string;
  };
  error?: string;
}

/**
 * Payment verification service for Polkadot ecosystem
 */
export class PaymentService {
  private client: PolkadotClient;
  private network: NetworkName;

  constructor(network: NetworkName = 'polkadot') {
    this.network = network;
    this.client = new PolkadotClient(network);
  }

  /**
   * Verify a payment on-chain
   */
  async verifyPayment(params: {
    extrinsicHash: string;
    fromAddress: string;
    toAddress: string;
    expectedAmount: string;
  }): Promise<PaymentVerificationResult> {
    try {
      // Validate addresses
      if (!isValidPolkadotAddress(params.fromAddress)) {
        return {
          verified: false,
          status: 'FAILED' as PaymentStatus,
          error: 'Invalid sender address',
        };
      }

      if (!isValidPolkadotAddress(params.toAddress)) {
        return {
          verified: false,
          status: 'FAILED' as PaymentStatus,
          error: 'Invalid recipient address',
        };
      }

      // Format addresses to ensure consistent comparison
      const formattedFrom = formatPolkadotAddress(params.fromAddress, 0);
      const formattedTo = formatPolkadotAddress(params.toAddress, 0);

      if (!formattedFrom || !formattedTo) {
        return {
          verified: false,
          status: 'FAILED' as PaymentStatus,
          error: 'Failed to format addresses',
        };
      }

      // Verify the transfer on-chain
      const result = await this.client.verifyTransfer({
        extrinsicHash: params.extrinsicHash,
        expectedFrom: formattedFrom,
        expectedTo: formattedTo,
        expectedAmount: params.expectedAmount,
      });

      if (!result.verified) {
        return {
          verified: false,
          status: 'FAILED' as PaymentStatus,
          error: result.error,
        };
      }

      return {
        verified: true,
        status: 'CONFIRMED' as PaymentStatus,
        details: {
          blockNumber: result.details!.blockNumber,
          timestamp: result.details!.timestamp,
          actualAmount: result.details!.actualAmount,
          fee: result.details!.fee,
        },
      };
    } catch (error) {
      return {
        verified: false,
        status: 'FAILED' as PaymentStatus,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a payment record
   */
  createPaymentRecord(params: {
    submissionId: string;
    organizationId: string;
    recipientAddress: string;
    amount: string;
    token: string;
    extrinsicHash?: string;
    paidBy: string;
  }): Omit<PaymentRecord, 'id'> {
    return {
      submissionId: params.submissionId,
      organizationId: params.organizationId,
      recipientAddress: params.recipientAddress,
      amount: params.amount,
      token: params.token,
      extrinsicHash: params.extrinsicHash,
      status: params.extrinsicHash ? 'PROCESSING' as PaymentStatus : 'PENDING' as PaymentStatus,
      paidBy: params.paidBy,
      paidAt: params.extrinsicHash ? new Date() : undefined,
    };
  }

  /**
   * Format amount for display (considering decimals)
   */
  formatAmount(amount: string, token = 'DOT'): string {
    const decimals = token === 'DOT' ? 10 : 12; // DOT has 10 decimals, KSM has 12
    const divisor = Math.pow(10, decimals);
    const value = parseFloat(amount) / divisor;
    return value.toFixed(4);
  }

  /**
   * Parse amount from display format to chain format
   */
  parseAmount(displayAmount: string, token = 'DOT'): string {
    const decimals = token === 'DOT' ? 10 : 12;
    const multiplier = Math.pow(10, decimals);
    const value = parseFloat(displayAmount) * multiplier;
    return value.toString();
  }

  /**
   * Get explorer URL for a transaction
   */
  getExplorerUrl(extrinsicHash: string): string {
    return this.client.getExtrinsicUrl(extrinsicHash);
  }

  /**
   * Disconnect from blockchain
   */
  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }
}