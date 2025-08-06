import { z } from 'zod';
import { isValidPolkadotAddress } from '@packages/polkadot';

/**
 * Validates a Polkadot wallet address
 * Accepts addresses from Polkadot, Kusama, or generic Substrate chains
 */
export const polkadotAddressSchema = z.string()
  .min(1, 'Wallet address is required')
  .refine(
    (address) => {
      // Check if it's a valid Polkadot address (SS58 format 0)
      if (isValidPolkadotAddress(address, 0)) return true;
      
      // Check if it's a valid Kusama address (SS58 format 2)
      if (isValidPolkadotAddress(address, 2)) return true;
      
      // Check if it's a valid generic Substrate address (SS58 format 42)
      if (isValidPolkadotAddress(address, 42)) return true;
      
      return false;
    },
    {
      message: 'Please enter a valid Polkadot, Kusama, or Substrate wallet address',
    }
  );

/**
 * Schema for user profile forms that include wallet address
 */
export const userProfileWithWalletSchema = z.object({
  walletAddress: polkadotAddressSchema.optional().or(z.literal('')),
});

/**
 * Helper function to validate just the wallet address
 */
export function validateWalletAddress(address: string): { 
  isValid: boolean; 
  error?: string;
  network?: 'polkadot' | 'kusama' | 'substrate';
} {
  if (!address) {
    return { isValid: false, error: 'Wallet address is required' };
  }

  // Check which network the address belongs to
  if (isValidPolkadotAddress(address, 0)) {
    return { isValid: true, network: 'polkadot' };
  }
  
  if (isValidPolkadotAddress(address, 2)) {
    return { isValid: true, network: 'kusama' };
  }
  
  if (isValidPolkadotAddress(address, 42)) {
    return { isValid: true, network: 'substrate' };
  }

  return { 
    isValid: false, 
    error: 'Please enter a valid Polkadot, Kusama, or Substrate wallet address' 
  };
}