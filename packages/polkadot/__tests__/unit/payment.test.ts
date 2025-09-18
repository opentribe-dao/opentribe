import { beforeEach, describe, expect, test, vi } from 'vitest';
import { PaymentService } from '../../src/payment';

// Mock dependencies
vi.mock('../../src/address', () => ({
  isValidPolkadotAddress: vi.fn(),
  formatPolkadotAddress: vi.fn(),
}));

vi.mock('../../src/client', () => ({
  Client: vi.fn().mockImplementation(() => ({
    disconnect: vi.fn(),
    getExtrinsicUrl: vi.fn(),
  })),
}));

vi.mock('../../src/subscan', () => ({
  SubscanClient: vi.fn(),
}));

vi.mock('../../src/utils', () => ({
  formatTokenAmount: vi.fn(),
}));

import { formatPolkadotAddress, isValidPolkadotAddress } from '../../src/address';
import { Client } from '../../src/client';
import { SubscanClient } from '../../src/subscan';
import { formatTokenAmount } from '../../src/utils';

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockSubscanClient: any;
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Subscan client
    mockSubscanClient = {
      getExtrinsicDetail: vi.fn(),
    };
    (SubscanClient as any).mockImplementation(() => mockSubscanClient);

    // Setup mock blockchain client
    mockClient = {
      disconnect: vi.fn(),
      getExtrinsicUrl: vi.fn(),
    };
    (Client as any).mockImplementation(() => mockClient);

    // Set environment variable for tests
    process.env.SUBSCAN_API_KEY = 'test-api-key';

    paymentService = new PaymentService('polkadot');
  });

  afterEach(() => {
    delete process.env.SUBSCAN_API_KEY;
  });

  describe('constructor', () => {
    test('should create service with default Polkadot network', () => {
      const service = new PaymentService();
      expect(service).toBeDefined();
      expect(Client).toHaveBeenCalledWith('polkadot');
    });

    test('should create service with Kusama network', () => {
      const service = new PaymentService('kusama');
      expect(service).toBeDefined();
      expect(Client).toHaveBeenCalledWith('kusama');
    });
  });

  describe('verifyPayment', () => {
    test('should verify successful payment', async () => {
      (isValidPolkadotAddress as any).mockReturnValue(true);
      (formatPolkadotAddress as any)
        .mockReturnValueOnce('formattedFrom')
        .mockReturnValueOnce('formattedTo');

      mockSubscanClient.getExtrinsicDetail.mockResolvedValue({
        block_num: 5000000,
        block_timestamp: 1700000000,
        call_module: 'balances',
        call_module_function: 'transfer',
        success: true,
        fee: '1000000',
      });

      const result = await paymentService.verifyPayment({
        extrinsicHash: '0x123',
        fromAddress: 'fromAddr',
        toAddress: 'toAddr',
        expectedAmount: '10000000000',
      });

      expect(result.verified).toBe(true);
      expect(result.status).toBe('CONFIRMED');
      expect(result.details).toEqual({
        blockNumber: 5000000,
        timestamp: 1700000000,
        actualAmount: '10000000000',
        fee: '1000000',
      });
    });

    test('should reject invalid sender address', async () => {
      (isValidPolkadotAddress as any).mockReturnValue(false);

      const result = await paymentService.verifyPayment({
        extrinsicHash: '0x123',
        fromAddress: 'invalid',
        toAddress: 'toAddr',
        expectedAmount: '10000000000',
      });

      expect(result.verified).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.error).toBe('Invalid sender address');
    });

    test('should reject invalid recipient address', async () => {
      (isValidPolkadotAddress as any)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const result = await paymentService.verifyPayment({
        extrinsicHash: '0x123',
        fromAddress: 'fromAddr',
        toAddress: 'invalid',
        expectedAmount: '10000000000',
      });

      expect(result.verified).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.error).toBe('Invalid recipient address');
    });

    test('should handle missing API key', async () => {
      delete process.env.SUBSCAN_API_KEY;

      (isValidPolkadotAddress as any).mockReturnValue(true);
      (formatPolkadotAddress as any)
        .mockReturnValueOnce('formattedFrom')
        .mockReturnValueOnce('formattedTo');

      const result = await paymentService.verifyPayment({
        extrinsicHash: '0x123',
        fromAddress: 'fromAddr',
        toAddress: 'toAddr',
        expectedAmount: '10000000000',
      });

      expect(result.verified).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.error).toContain('Missing SUBSCAN_API_KEY');
    });

    test('should handle failed extrinsic', async () => {
      process.env.SUBSCAN_API_KEY = 'test-key';

      (isValidPolkadotAddress as any).mockReturnValue(true);
      (formatPolkadotAddress as any)
        .mockReturnValueOnce('formattedFrom')
        .mockReturnValueOnce('formattedTo');

      mockSubscanClient.getExtrinsicDetail.mockResolvedValue({
        block_num: 5000000,
        block_timestamp: 1700000000,
        call_module: 'balances',
        call_module_function: 'transfer',
        success: false,
        fee: '1000000',
      });

      const result = await paymentService.verifyPayment({
        extrinsicHash: '0x123',
        fromAddress: 'fromAddr',
        toAddress: 'toAddr',
        expectedAmount: '10000000000',
      });

      expect(result.verified).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.error).toContain('Extrinsic not successful');
    });

    test('should handle non-transfer extrinsic', async () => {
      process.env.SUBSCAN_API_KEY = 'test-key';

      (isValidPolkadotAddress as any).mockReturnValue(true);
      (formatPolkadotAddress as any)
        .mockReturnValueOnce('formattedFrom')
        .mockReturnValueOnce('formattedTo');

      mockSubscanClient.getExtrinsicDetail.mockResolvedValue({
        block_num: 5000000,
        block_timestamp: 1700000000,
        call_module: 'system',
        call_module_function: 'remark',
        success: true,
        fee: '1000000',
      });

      const result = await paymentService.verifyPayment({
        extrinsicHash: '0x123',
        fromAddress: 'fromAddr',
        toAddress: 'toAddr',
        expectedAmount: '10000000000',
      });

      expect(result.verified).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.error).toContain('not a balances.transfer');
    });

    test('should handle Subscan API errors', async () => {
      process.env.SUBSCAN_API_KEY = 'test-key';

      (isValidPolkadotAddress as any).mockReturnValue(true);
      (formatPolkadotAddress as any)
        .mockReturnValueOnce('formattedFrom')
        .mockReturnValueOnce('formattedTo');

      mockSubscanClient.getExtrinsicDetail.mockRejectedValue(
        new Error('API error')
      );

      const result = await paymentService.verifyPayment({
        extrinsicHash: '0x123',
        fromAddress: 'fromAddr',
        toAddress: 'toAddr',
        expectedAmount: '10000000000',
      });

      expect(result.verified).toBe(false);
      expect(result.status).toBe('FAILED');
      expect(result.error).toBe('API error');
    });
  });

  describe('createPaymentRecord', () => {
    test('should create payment record with extrinsic hash', () => {
      const record = paymentService.createPaymentRecord({
        submissionId: 'submission-1',
        organizationId: 'org-1',
        recipientAddress: 'recipient-addr',
        amount: '10000000000',
        token: 'DOT',
        extrinsicHash: '0x123',
        paidBy: 'payer-id',
      });

      expect(record).toMatchObject({
        submissionId: 'submission-1',
        organizationId: 'org-1',
        recipientAddress: 'recipient-addr',
        amount: '10000000000',
        token: 'DOT',
        extrinsicHash: '0x123',
        status: 'PROCESSING',
        paidBy: 'payer-id',
      });
      expect(record.paidAt).toBeDefined();
    });

    test('should create pending payment record without extrinsic hash', () => {
      const record = paymentService.createPaymentRecord({
        submissionId: 'submission-2',
        organizationId: 'org-2',
        recipientAddress: 'recipient-addr',
        amount: '20000000000',
        token: 'KSM',
        paidBy: 'payer-id',
      });

      expect(record).toMatchObject({
        submissionId: 'submission-2',
        organizationId: 'org-2',
        recipientAddress: 'recipient-addr',
        amount: '20000000000',
        token: 'KSM',
        status: 'PENDING',
        paidBy: 'payer-id',
      });
      expect(record.paidAt).toBeUndefined();
    });
  });

  describe('formatAmount', () => {
    test('should format DOT amount', () => {
      (formatTokenAmount as any).mockReturnValue('100.0000 DOT');

      const result = paymentService.formatAmount('1000000000000', 'DOT');

      expect(result).toBe('100.0000 DOT');
      expect(formatTokenAmount).toHaveBeenCalledWith('1000000000000', 'polkadot');
    });

    test('should format KSM amount', () => {
      (formatTokenAmount as any).mockReturnValue('50.0000 KSM');

      const result = paymentService.formatAmount('500000000000000', 'KSM');

      expect(result).toBe('50.0000 KSM');
      expect(formatTokenAmount).toHaveBeenCalledWith('500000000000000', 'kusama');
    });

    test('should default to DOT if no token specified', () => {
      (formatTokenAmount as any).mockReturnValue('10.0000 DOT');

      const result = paymentService.formatAmount('100000000000');

      expect(result).toBe('10.0000 DOT');
      expect(formatTokenAmount).toHaveBeenCalledWith('100000000000', 'polkadot');
    });
  });

  describe('parseAmount', () => {
    test('should parse DOT display amount to chain format', () => {
      const result = paymentService.parseAmount('100.5', 'DOT');
      expect(result).toBe('1005000000000');
    });

    test('should parse KSM display amount to chain format', () => {
      const result = paymentService.parseAmount('50.25', 'KSM');
      expect(result).toBe('50250000000000');
    });

    test('should handle integer amounts', () => {
      const result = paymentService.parseAmount('1000', 'DOT');
      expect(result).toBe('10000000000000');
    });

    test('should handle small amounts', () => {
      const result = paymentService.parseAmount('0.001', 'DOT');
      expect(result).toBe('10000000');
    });

    test('should handle zero amount', () => {
      const result = paymentService.parseAmount('0', 'DOT');
      expect(result).toBe('0');
    });

    test('should round fractional amounts', () => {
      const result = paymentService.parseAmount('0.0000000001', 'DOT');
      expect(result).toBe('1');
    });

    test('should default to DOT if no token specified', () => {
      const result = paymentService.parseAmount('10');
      expect(result).toBe('100000000000');
    });
  });

  describe('getExplorerUrl', () => {
    test('should return explorer URL for extrinsic', () => {
      mockClient.getExtrinsicUrl.mockReturnValue(
        'https://polkadot.subscan.io/extrinsic/0x123'
      );

      const url = paymentService.getExplorerUrl('0x123');

      expect(url).toBe('https://polkadot.subscan.io/extrinsic/0x123');
      expect(mockClient.getExtrinsicUrl).toHaveBeenCalledWith('0x123');
    });
  });

  describe('disconnect', () => {
    test('should disconnect from blockchain', async () => {
      await paymentService.disconnect();

      expect(mockClient.disconnect).toHaveBeenCalled();
    });
  });
});