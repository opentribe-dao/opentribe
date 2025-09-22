import { z } from "zod";

const POLKADOT_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{46,48}$/;

// Polkadot address validation schema
export const polkadotAddressSchema = z.string().refine(
  (address) => {
    // Basic check for Polkadot address format
    // Polkadot addresses typically start with 1 and are 47-48 characters
    // Kusama addresses start with a capital letter
    return POLKADOT_ADDRESS_REGEX.test(address);
  },
  {
    message: "Invalid Polkadot address format",
  }
);

// Payment status enum
export type PaymentStatus = "PENDING" | "PROCESSING" | "CONFIRMED" | "FAILED";

// Payment record type
export interface PaymentRecord {
  id: string;
  submissionId: string;
  organizationId: string;
  recipientAddress: string;
  amount: string;
  token: string;
  extrinsicHash?: string;
  blockNumber?: number;
  status: PaymentStatus;
  paidAt?: Date;
  paidBy: string;
  verifiedAt?: Date;
  metadata?: Record<string, unknown>;
}

// Blockchain transaction types
export interface TransactionDetails {
  extrinsicHash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  amount: string;
  fee: string;
  success: boolean;
}

export interface TransferEvent {
  from: string;
  to: string;
  amount: string;
  blockNumber?: number;
  extrinsicHash?: string;
  timestamp?: number;
}
