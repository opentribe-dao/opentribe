import { describe, expect, test } from 'vitest';
import { polkadotAddressSchema } from '../../src/types';

describe('Types', () => {
  describe('polkadotAddressSchema', () => {
    test('should validate valid Polkadot addresses', () => {
      const validAddresses = [
        '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5', // Polkadot
        '14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3', // Polkadot
        'CpjsLDC1JFyrhm3ftC9Gs4QoyrkHKhZKtK7YqGTRFtTafgp', // Kusama
        'HNZata7iMYWmk5RvZRTiAsSDhV8366zq2YGb3tLH5Upf74F', // Kusama
        '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', // Westend
      ];

      for (const address of validAddresses) {
        const result = polkadotAddressSchema.safeParse(address);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(address);
        }
      }
    });

    test('should reject invalid addresses', () => {
      const invalidAddresses = [
        { value: '', comment: 'Empty string' },
        { value: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', comment: 'Ethereum address' },
        { value: '123', comment: 'Too short' },
        { value: 'not-an-address', comment: 'Invalid characters' },
        { value: '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5!', comment: 'Extra character' },
        { value: '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr', comment: 'Too short (45 chars)' },
        { value: '1234567890123456789012345678901234567890123456789', comment: 'Too long (49 chars)' },
        {
          value: '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5' +
            'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          comment: 'Way too long'
        },
      ];

      for (const { value: address, comment } of invalidAddresses) {
        const result = polkadotAddressSchema.safeParse(address);
        expect(result.success, `Expected "${address}" (${comment}) to be invalid`).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Invalid Polkadot address format'
          );
        }
      }
    });

    test('should reject addresses with invalid characters', () => {
      const invalidChars = [
        '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6S#5', // Contains #
        '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6S@5', // Contains @
        '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6S!5', // Contains !
        '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6S_5', // Contains _
        '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6S-5', // Contains -
      ];

      for (const address of invalidChars) {
        const result = polkadotAddressSchema.safeParse(address);
        expect(result.success).toBe(false);
      }
    });

    test('should validate addresses that start with 0', () => {
      // Addresses starting with 0 are invalid for Polkadot/Kusama/Substrate
      const zeroStartAddresses = [
        '0oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5',
        '0pjsLDC1JFyrhm3ftC9Gs4QoyrkHKhZKtK7YqGTRFtTafgp',
      ];

      for (const address of zeroStartAddresses) {
        const result = polkadotAddressSchema.safeParse(address);
        expect(result.success).toBe(false);
      }
    });

    test('should handle edge cases', () => {
      expect(polkadotAddressSchema.safeParse(null).success).toBe(false);
      expect(polkadotAddressSchema.safeParse(undefined).success).toBe(false);
      expect(polkadotAddressSchema.safeParse(123).success).toBe(false);
      expect(polkadotAddressSchema.safeParse({}).success).toBe(false);
      expect(polkadotAddressSchema.safeParse([]).success).toBe(false);
    });
  });
});