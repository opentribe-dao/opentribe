import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SubscanClient } from '../../src/subscan';

// The fetch is already mocked in setup.ts
const mockFetch = global.fetch as any;

describe('SubscanClient', () => {
  let client: SubscanClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new SubscanClient('polkadot', 'test-api-key');
  });

  describe('constructor', () => {
    test('should initialize with correct base URL for Polkadot', () => {
      const polkadotClient = new SubscanClient('polkadot', 'test-key');
      expect(polkadotClient).toBeDefined();
    });

    test('should initialize with correct base URL for Kusama', () => {
      const kusamaClient = new SubscanClient('kusama', 'test-key');
      expect(kusamaClient).toBeDefined();
    });

    test('should initialize with correct base URL for Westend', () => {
      const westendClient = new SubscanClient('westend', 'test-key');
      expect(westendClient).toBeDefined();
    });
  });

  describe('getBlockDetail', () => {
    test('should fetch block detail successfully', async () => {
      const mockBlockData = {
        block_num: 1000000,
        block_timestamp: 1640000000,
        events: [
          {
            event_index: '1000000-0',
            extrinsic_hash: '0x123',
            module_id: 'balances',
            event_id: 'Transfer',
            params: JSON.stringify({ from: 'addr1', to: 'addr2', amount: '100' }),
          },
        ],
        extrinsics: [
          {
            extrinsic_hash: '0x123',
            call_module: 'balances',
            call_module_function: 'transfer',
            success: true,
            fee: '1000000',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          message: 'Success',
          data: mockBlockData,
        }),
      });

      const result = await client.getBlockDetail({ block_num: 1000000 });

      expect(result).toEqual(mockBlockData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://polkadot.api.subscan.io/api/scan/block',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': 'test-api-key',
          },
          body: JSON.stringify({ block_num: 1000000 }),
        }
      );
    });

    test('should fetch block by hash', async () => {
      const mockBlockData = {
        block_num: 2000000,
        block_timestamp: 1650000000,
        events: [],
        extrinsics: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          message: 'Success',
          data: mockBlockData,
        }),
      });

      const result = await client.getBlockDetail({
        block_hash: '0xabcdef',
      });

      expect(result).toEqual(mockBlockData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://polkadot.api.subscan.io/api/scan/block',
        expect.objectContaining({
          body: JSON.stringify({ block_hash: '0xabcdef' }),
        })
      );
    });

    test('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(client.getBlockDetail({ block_num: 1000000 })).rejects.toThrow(
        'Subscan HTTP 500'
      );
    });

    test('should handle API error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1001,
          message: 'Invalid API key',
          data: null,
        }),
      });

      await expect(client.getBlockDetail({ block_num: 1000000 })).rejects.toThrow(
        'Subscan error: Invalid API key'
      );
    });

    test('should handle missing data in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          message: 'Success',
          // data is missing
        }),
      });

      await expect(client.getBlockDetail({ block_num: 1000000 })).rejects.toThrow(
        'Subscan error: Success'
      );
    });
  });

  describe('getExtrinsicDetail', () => {
    test('should fetch extrinsic detail successfully', async () => {
      const mockExtrinsicData = {
        block_num: 3000000,
        block_timestamp: 1660000000,
        extrinsic_index: '3000000-1',
        account_id: '15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5',
        call_module: 'balances',
        call_module_function: 'transfer',
        extrinsic_hash: '0x789abc',
        success: true,
        fee: '2000000',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          message: 'Success',
          data: mockExtrinsicData,
        }),
      });

      const result = await client.getExtrinsicDetail('0x789abc');

      expect(result).toEqual(mockExtrinsicData);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://polkadot.api.subscan.io/api/scan/extrinsic',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': 'test-api-key',
          },
          body: JSON.stringify({ hash: '0x789abc' }),
        }
      );
    });

    test('should handle failed extrinsic', async () => {
      const mockExtrinsicData = {
        block_num: 4000000,
        block_timestamp: 1670000000,
        extrinsic_index: '4000000-2',
        call_module: 'balances',
        call_module_function: 'transfer',
        extrinsic_hash: '0xfailed',
        success: false,
        fee: '1500000',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          message: 'Success',
          data: mockExtrinsicData,
        }),
      });

      const result = await client.getExtrinsicDetail('0xfailed');

      expect(result).toEqual(mockExtrinsicData);
      expect(result.success).toBe(false);
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getExtrinsicDetail('0x123')).rejects.toThrow(
        'Network error'
      );
    });

    test('should handle rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      await expect(client.getExtrinsicDetail('0x123')).rejects.toThrow(
        'Subscan HTTP 429'
      );
    });
  });

  describe('different networks', () => {
    test('should use correct Kusama API URL', async () => {
      const kusamaClient = new SubscanClient('kusama', 'test-key');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          message: 'Success',
          data: { extrinsic_hash: '0x123' },
        }),
      });

      await kusamaClient.getExtrinsicDetail('0x123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://kusama.api.subscan.io/api/scan/extrinsic',
        expect.any(Object)
      );
    });

    test('should use correct Westend API URL', async () => {
      const westendClient = new SubscanClient('westend', 'test-key');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 0,
          message: 'Success',
          data: { block_num: 5000000 },
        }),
      });

      await westendClient.getBlockDetail({ block_num: 5000000 });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://westend.api.subscan.io/api/scan/block',
        expect.any(Object)
      );
    });
  });
});