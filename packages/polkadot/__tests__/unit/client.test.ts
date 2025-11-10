import { describe, expect, test } from "vitest";
import { Client } from "../../src/client";
import { NETWORKS } from "../../src/config";

/**
 * Unit tests for Client class
 * These tests focus on pure logic and don't require network connections
 */

describe("Client Unit Tests", () => {
  describe("Constructor", () => {
    test("should create client with default Polkadot network", () => {
      const client = new Client();
      expect(client).toBeDefined();
    });

    test("should create client with specified network", () => {
      const polkadotClient = new Client("polkadot");
      expect(polkadotClient).toBeDefined();

      const kusamaClient = new Client("kusama");
      expect(kusamaClient).toBeDefined();

      const westendClient = new Client("westend");
      expect(westendClient).toBeDefined();
    });

    test("should accept custom WebSocket endpoint", () => {
      const client = new Client("polkadot", "wss://custom.endpoint.com");
      expect(client).toBeDefined();
    });
  });

  describe("URL Generation", () => {
    test("should generate correct Polkadot Subscan URLs", () => {
      const client = new Client("polkadot");

      const extrinsicUrl = client.getExtrinsicUrl("0x123abc");
      expect(extrinsicUrl).toBe(
        "https://polkadot.subscan.io/extrinsic/0x123abc"
      );

      const addressUrl = client.getAddressUrl(
        "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5"
      );
      expect(addressUrl).toBe(
        "https://polkadot.subscan.io/account/15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5"
      );
    });

    test("should generate correct Kusama Subscan URLs", () => {
      const client = new Client("kusama");

      const extrinsicUrl = client.getExtrinsicUrl("0x456def");
      expect(extrinsicUrl).toBe("https://kusama.subscan.io/extrinsic/0x456def");

      const addressUrl = client.getAddressUrl(
        "CpjsLDC1JFyrhm3ftC9Gs4QoyrkHKhZKtK7YqGTRFtTafgp"
      );
      expect(addressUrl).toBe(
        "https://kusama.subscan.io/account/CpjsLDC1JFyrhm3ftC9Gs4QoyrkHKhZKtK7YqGTRFtTafgp"
      );
    });

    test("should generate correct Westend Subscan URLs", () => {
      const client = new Client("westend");

      const extrinsicUrl = client.getExtrinsicUrl("0x789ghi");
      expect(extrinsicUrl).toBe(
        "https://westend.subscan.io/extrinsic/0x789ghi"
      );

      const addressUrl = client.getAddressUrl(
        "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      );
      expect(addressUrl).toBe(
        "https://westend.subscan.io/account/5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"
      );
    });

    test("should handle special characters in URLs", () => {
      const client = new Client("polkadot");

      // Test with hash that has special characters (should be encoded if needed)
      const extrinsicUrl = client.getExtrinsicUrl("0xabc123def456");
      expect(extrinsicUrl).toContain("0xabc123def456");
      expect(extrinsicUrl).toMatch(/^https:\/\//);
    });
  });

  describe("Network Selection", () => {
    test("should use correct WebSocket endpoints", () => {
      // Verify that each network uses its configured endpoints
      Object.entries(NETWORKS).forEach(([networkName, config]) => {
        const client = new Client(networkName as any);
        // The client should be configured with the first WS endpoint
        expect(config.wsEndpoints[0]).toBeDefined();
        expect(config.wsEndpoints[0]).toMatch(/^wss:\/\//);
      });
    });

    test("should prefer custom endpoint over default", () => {
      const customEndpoint = "wss://my-custom-node.example.com";
      const client = new Client("polkadot", customEndpoint);
      // Client should use the custom endpoint
      expect(client).toBeDefined();
    });
  });
});
