import { describe, expect, test } from 'vitest';
import { NETWORKS } from '../../src/config';

describe('Config', () => {
  describe('NETWORKS', () => {
    test('should have Polkadot network configuration', () => {
      const polkadot = NETWORKS.polkadot;

      expect(polkadot).toBeDefined();
      expect(polkadot.name).toBe('Polkadot');
      expect(polkadot.ss58Format).toBe(0);
      expect(polkadot.decimals).toBe(10);
      expect(polkadot.symbol).toBe('DOT');
      expect(polkadot.subscanUrl).toBe('https://polkadot.subscan.io');
      expect(polkadot.subscanAPIUrl).toBe('https://polkadot.api.subscan.io');
      expect(polkadot.wsEndpoints).toBeInstanceOf(Array);
      expect(polkadot.wsEndpoints.length).toBeGreaterThan(0);
      expect(polkadot.wsEndpoints).toContain('wss://rpc.polkadot.io');
    });

    test('should have Kusama network configuration', () => {
      const kusama = NETWORKS.kusama;

      expect(kusama).toBeDefined();
      expect(kusama.name).toBe('Kusama');
      expect(kusama.ss58Format).toBe(2);
      expect(kusama.decimals).toBe(12);
      expect(kusama.symbol).toBe('KSM');
      expect(kusama.subscanUrl).toBe('https://kusama.subscan.io');
      expect(kusama.subscanAPIUrl).toBe('https://kusama.api.subscan.io');
      expect(kusama.wsEndpoints).toBeInstanceOf(Array);
      expect(kusama.wsEndpoints.length).toBeGreaterThan(0);
      expect(kusama.wsEndpoints).toContain('wss://kusama-rpc.polkadot.io');
    });

    test('should have Westend network configuration', () => {
      const westend = NETWORKS.westend;

      expect(westend).toBeDefined();
      expect(westend.name).toBe('Westend');
      expect(westend.ss58Format).toBe(42);
      expect(westend.decimals).toBe(12);
      expect(westend.symbol).toBe('WND');
      expect(westend.subscanUrl).toBe('https://westend.subscan.io');
      expect(westend.subscanAPIUrl).toBe('https://westend.api.subscan.io');
      expect(westend.wsEndpoints).toBeInstanceOf(Array);
      expect(westend.wsEndpoints.length).toBeGreaterThan(0);
      expect(westend.wsEndpoints).toContain('wss://westend-rpc.polkadot.io');
    });

    test('should have all required fields for each network', () => {
      const networks = Object.values(NETWORKS);
      const requiredFields = [
        'name',
        'ss58Format',
        'decimals',
        'symbol',
        'subscanUrl',
        'wsEndpoints',
        'subscanAPIUrl',
      ];

      for (const network of networks) {
        for (const field of requiredFields) {
          expect(network).toHaveProperty(field);
          expect(network[field as keyof typeof network]).toBeDefined();
        }
      }
    });

    test('should have valid WebSocket endpoints', () => {
      const networks = Object.values(NETWORKS);

      for (const network of networks) {
        expect(network.wsEndpoints).toBeInstanceOf(Array);
        expect(network.wsEndpoints.length).toBeGreaterThan(0);

        for (const endpoint of network.wsEndpoints) {
          expect(endpoint).toMatch(/^wss:\/\/.+/);
        }
      }
    });

    test('should have valid Subscan URLs', () => {
      const networks = Object.values(NETWORKS);

      for (const network of networks) {
        expect(network.subscanUrl).toMatch(/^https:\/\/.+subscan\.io$/);
        expect(network.subscanAPIUrl).toMatch(/^https:\/\/.+\.api\.subscan\.io$/);
      }
    });

    test('should have correct decimal places for each network', () => {
      expect(NETWORKS.polkadot.decimals).toBe(10);
      expect(NETWORKS.kusama.decimals).toBe(12);
      expect(NETWORKS.westend.decimals).toBe(12);
    });

    test('should be a constant object with expected keys', () => {
      // Test that NETWORKS has expected keys
      const networkKeys = Object.keys(NETWORKS);
      expect(networkKeys).toEqual(['polkadot', 'kusama', 'westend']);

      // TypeScript ensures immutability at compile time with 'as const'
      // The object itself is still extensible at runtime, but TypeScript prevents modifications
      expect(networkKeys.length).toBe(3);
    });
  });
});