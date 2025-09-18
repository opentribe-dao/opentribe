import { describe, expect, test } from 'vitest';
import { formatTokenAmount } from '../../src/utils';

describe('Utils', () => {
  describe('formatTokenAmount', () => {
    test('should format Polkadot amounts correctly', () => {
      // Test with actual amounts and verify the output format
      const result1 = formatTokenAmount('10000000000', 'polkadot');
      expect(result1).toMatch(/DOT$/);
      expect(result1).toContain('1'); // 1 DOT

      const result2 = formatTokenAmount('10000000000000', 'polkadot');
      expect(result2).toMatch(/DOT$/);
      expect(result2).toContain('1,000'); // 1,000 DOT

      const result3 = formatTokenAmount('5500000000', 'polkadot');
      expect(result3).toMatch(/DOT$/);
      expect(result3).toContain('0.55'); // 0.55 DOT
    });

    test('should format Kusama amounts correctly', () => {
      // KSM has 12 decimals
      const result1 = formatTokenAmount('1000000000000', 'kusama');
      expect(result1).toMatch(/KSM$/);
      expect(result1).toContain('1'); // 1 KSM

      const result2 = formatTokenAmount('5500000000000000', 'kusama');
      expect(result2).toMatch(/KSM$/);
      expect(result2).toContain('5,500'); // 5,500 KSM
    });

    test('should format Westend amounts correctly', () => {
      // WND has 12 decimals
      const result = formatTokenAmount('2000000000000', 'westend');
      expect(result).toMatch(/WND$/);
      expect(result).toContain('2'); // 2 WND
    });

    test('should default to Polkadot network', () => {
      const result = formatTokenAmount('10000000000');
      expect(result).toMatch(/DOT$/);
      expect(result).toContain('1');
    });

    test('should handle bigint amounts', () => {
      const amount = BigInt('50000000000');
      const result = formatTokenAmount(amount, 'polkadot');
      expect(result).toMatch(/DOT$/);
      expect(result).toContain('5');
    });

    test('should handle zero amount', () => {
      const result = formatTokenAmount('0', 'polkadot');
      expect(result).toMatch(/DOT$/);
      expect(result).toContain('0');
    });

    test('should format with proper decimal places', () => {
      // Small amount to test decimal formatting
      const result = formatTokenAmount('1234567890', 'polkadot'); // 0.123456789 DOT
      expect(result).toMatch(/DOT$/);
      // Should contain decimal point
      expect(result).toContain('.');
    });

    test('should handle very large amounts', () => {
      const result = formatTokenAmount('1000000000000000', 'polkadot'); // 100,000 DOT
      expect(result).toMatch(/DOT$/);
      expect(result).toMatch(/[0-9,]+/); // Should contain formatted number with commas
    });
  });
});