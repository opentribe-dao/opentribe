import { encodeAddress, decodeAddress, checkAddress } from '@polkadot/util-crypto';

/**
 * Validates a Polkadot/Substrate address
 * @param address The address to validate
 * @param ss58Format The SS58 format (0 for Polkadot, 2 for Kusama, etc.)
 * @returns True if valid, false otherwise
 */
export function isValidPolkadotAddress(address: string, ss58Format = 0): boolean {
  try {
    const result = checkAddress(address, ss58Format);
    return result[0]; // Returns [isValid, errorMessage]
  } catch {
    return false;
  }
}

/**
 * Formats a Polkadot address to a specific SS58 format
 * @param address The address to format
 * @param ss58Format The target SS58 format (0 for Polkadot, 2 for Kusama)
 * @returns The formatted address or null if invalid
 */
export function formatPolkadotAddress(address: string, ss58Format = 0): string | null {
  try {
    const decoded = decodeAddress(address);
    return encodeAddress(decoded, ss58Format);
  } catch {
    return null;
  }
}

/**
 * Gets a shortened version of an address for display
 * @param address The full address
 * @param chars Number of characters to show on each side
 * @returns Shortened address like "1abc...xyz"
 */
export function shortenAddress(address: string, chars = 6): string {
  if (!address || address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Checks if two addresses are the same (accounting for different SS58 formats)
 * @param address1 First address
 * @param address2 Second address
 * @returns True if they represent the same account
 */
export function isSameAddress(address1: string, address2: string): boolean {
  try {
    const decoded1 = decodeAddress(address1);
    const decoded2 = decodeAddress(address2);
    return decoded1.toString() === decoded2.toString();
  } catch {
    return false;
  }
}

/**
 * Network configurations for common Polkadot networks
 */
export const NETWORK_CONFIG = {
  polkadot: {
    name: 'Polkadot',
    ss58Format: 0,
    decimals: 10,
    symbol: 'DOT',
    subscanUrl: 'https://polkadot.subscan.io',
  },
  kusama: {
    name: 'Kusama',
    ss58Format: 2,
    decimals: 12,
    symbol: 'KSM',
    subscanUrl: 'https://kusama.subscan.io',
  },
  westend: {
    name: 'Westend',
    ss58Format: 42,
    decimals: 12,
    symbol: 'WND',
    subscanUrl: 'https://westend.subscan.io',
  },
} as const;

export type NetworkName = keyof typeof NETWORK_CONFIG;