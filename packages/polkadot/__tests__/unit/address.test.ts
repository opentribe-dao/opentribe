import { describe, expect, test } from "vitest";
import {
  formatPolkadotAddress,
  isSameAddress,
  isValidPolkadotAddress,
  shortenAddress,
} from "../../src/address";

describe("Address utilities", () => {
  describe("isValidPolkadotAddress", () => {
    test("should return true for valid Polkadot addresses", () => {
      // These are real, valid Polkadot addresses
      expect(
        isValidPolkadotAddress(
          "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
          0
        )
      ).toBe(true);
      expect(
        isValidPolkadotAddress(
          "14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3",
          0
        )
      ).toBe(true);
      expect(
        isValidPolkadotAddress(
          "1zugcag7cJVBtVRnFxv5Qftn7xKAnR6YJ9x4x3XLgGgmNnS",
          0
        )
      ).toBe(true);
    });

    test("should return true for valid Kusama addresses", () => {
      expect(
        isValidPolkadotAddress(
          "CpjsLDC1JFyrhm3ftC9Gs4QoyrkHKhZKtK7YqGTRFtTafgp",
          2
        )
      ).toBe(true);
      expect(
        isValidPolkadotAddress(
          "FHKAe66mnbk8ke8zVWE9hFVFrJN1mprFPVmD5rrevotkcDZ",
          2
        )
      ).toBe(true);
      expect(
        isValidPolkadotAddress(
          "HNZata7iMYWmk5RvZRTiAsSDhV8366zq2YGb3tLH5Upf74F",
          2
        )
      ).toBe(true);
    });

    test("should return true for valid Westend addresses", () => {
      expect(
        isValidPolkadotAddress(
          "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
          42
        )
      ).toBe(true);
    });

    test("should return false for invalid addresses", () => {
      expect(isValidPolkadotAddress("invalid-address")).toBe(false);
      expect(isValidPolkadotAddress("")).toBe(false);
      expect(isValidPolkadotAddress("1234567890")).toBe(false);
      expect(isValidPolkadotAddress("not-an-address")).toBe(false);
      expect(
        isValidPolkadotAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
      ).toBe(false); // Ethereum address
      expect(isValidPolkadotAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa")).toBe(
        false
      ); // Bitcoin address
    });

    test("should return false for truncated addresses", () => {
      // Valid address with last character removed
      expect(
        isValidPolkadotAddress(
          "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp"
        )
      ).toBe(false);
      expect(
        isValidPolkadotAddress(
          "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQ"
        )
      ).toBe(false);
    });

    test("should return false for addresses with extra characters", () => {
      expect(
        isValidPolkadotAddress(
          "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5!"
        )
      ).toBe(false);
      expect(
        isValidPolkadotAddress(
          "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5X"
        )
      ).toBe(false);
    });

    test("should return false for wrong SS58 format", () => {
      // Polkadot address (SS58 = 0) tested against Kusama format (SS58 = 2)
      expect(
        isValidPolkadotAddress(
          "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
          2
        )
      ).toBe(false);

      // Kusama address (SS58 = 2) tested against Polkadot format (SS58 = 0)
      expect(
        isValidPolkadotAddress(
          "CpjsLDC1JFyrhm3ftC9Gs4QoyrkHKhZKtK7YqGTRFtTafgp",
          0
        )
      ).toBe(false);

      // Westend address (SS58 = 42) tested against Polkadot format
      expect(
        isValidPolkadotAddress(
          "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
          0
        )
      ).toBe(false);
    });

    test("should use default SS58 format 0 (Polkadot) when not specified", () => {
      // Polkadot addresses should be valid with default
      expect(
        isValidPolkadotAddress(
          "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5"
        )
      ).toBe(true);
      expect(
        isValidPolkadotAddress(
          "14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3"
        )
      ).toBe(true);

      // Kusama addresses should be invalid with default
      expect(
        isValidPolkadotAddress(
          "CpjsLDC1JFyrhm3ftC9Gs4QoyrkHKhZKtK7YqGTRFtTafgp"
        )
      ).toBe(false);
    });
  });

  describe("formatPolkadotAddress", () => {
    test("should format Polkadot address to different SS58 formats", () => {
      const genericAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";

      // Format to Polkadot (SS58 = 0)
      const polkadotFormatted = formatPolkadotAddress(genericAddress, 0);
      expect(polkadotFormatted).toBeTruthy();
      expect(polkadotFormatted).toMatch(/^1/); // Polkadot addresses typically start with 1

      // Format to Kusama (SS58 = 2)
      const kusamaFormatted = formatPolkadotAddress(genericAddress, 2);
      expect(kusamaFormatted).toBeTruthy();
      expect(kusamaFormatted).toMatch(/^[A-Z]/); // Kusama addresses typically start with uppercase letter

      // Format to Westend (SS58 = 42)
      const westendFormatted = formatPolkadotAddress(genericAddress, 42);
      expect(westendFormatted).toBeTruthy();
      expect(westendFormatted).toMatch(/^5/); // Generic substrate addresses typically start with 5
    });

    test("should convert between Polkadot and Kusama formats", () => {
      const polkadotAddress =
        "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";

      // Convert Polkadot to Kusama format
      const kusamaFormatted = formatPolkadotAddress(polkadotAddress, 2);
      expect(kusamaFormatted).toBeTruthy();
      expect(kusamaFormatted).not.toBe(polkadotAddress);

      // Convert back to Polkadot format
      const backToPolkadot = formatPolkadotAddress(kusamaFormatted!, 0);
      expect(backToPolkadot).toBe(polkadotAddress);
    });

    test("should return null for invalid addresses", () => {
      expect(formatPolkadotAddress("invalid-address")).toBeNull();
      expect(formatPolkadotAddress("")).toBeNull();
      expect(formatPolkadotAddress("1234567890")).toBeNull();
      expect(formatPolkadotAddress("not-an-address")).toBeNull();
    });

    test("should use default SS58 format 0 when not specified", () => {
      const genericAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
      const formatted = formatPolkadotAddress(genericAddress);

      expect(formatted).toBeTruthy();
      expect(formatted).toMatch(/^1/); // Should be Polkadot format
    });
  });

  describe("shortenAddress", () => {
    test("should shorten long address with default chars", () => {
      const address = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";
      const result = shortenAddress(address);

      expect(result).toBe("15oF4u...Hr6Sp5");
      expect(result.length).toBe(15); // 6 + 3 (dots) + 6
    });

    test("should shorten with custom chars count", () => {
      const address = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";

      expect(shortenAddress(address, 4)).toBe("15oF...6Sp5");
      expect(shortenAddress(address, 3)).toBe("15o...Sp5");
      expect(shortenAddress(address, 10)).toBe("15oF4uVJwm...bjMNHr6Sp5");
    });

    test("should return original if address is short", () => {
      const shortAddress = "12345678";
      expect(shortenAddress(shortAddress)).toBe("12345678");
      expect(shortenAddress(shortAddress, 10)).toBe("12345678");
    });

    test("should handle edge cases", () => {
      expect(shortenAddress("")).toBe("");
      expect(shortenAddress(null as any)).toBe(null);
      expect(shortenAddress(undefined as any)).toBe(undefined);
    });

    test("should handle address exactly at threshold", () => {
      const address = "123456789012"; // 12 chars, threshold is 6*2=12
      expect(shortenAddress(address)).toBe("123456789012");

      const address13 = "1234567890123"; // 13 chars
      expect(shortenAddress(address13)).toBe("123456...890123");
    });
  });

  describe("isSameAddress", () => {
    test("should return true for same address with different SS58 formats", () => {
      // These are the same account but in different formats
      const genericAddress = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
      const polkadotFormat = formatPolkadotAddress(genericAddress, 0);
      const kusamaFormat = formatPolkadotAddress(genericAddress, 2);

      expect(polkadotFormat).toBeTruthy();
      expect(kusamaFormat).toBeTruthy();

      // All combinations should be recognized as the same address
      expect(isSameAddress(genericAddress, polkadotFormat!)).toBe(true);
      expect(isSameAddress(genericAddress, kusamaFormat!)).toBe(true);
      expect(isSameAddress(polkadotFormat!, kusamaFormat!)).toBe(true);
    });

    test("should return true for identical addresses", () => {
      const address = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";
      expect(isSameAddress(address, address)).toBe(true);
    });

    test("should return false for different addresses", () => {
      const address1 = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";
      const address2 = "14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3";

      expect(isSameAddress(address1, address2)).toBe(false);
    });

    test("should return false for invalid addresses", () => {
      expect(isSameAddress("invalid1", "invalid2")).toBe(false);
      expect(isSameAddress("", "")).toBe(false);
      expect(
        isSameAddress(
          "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5",
          "invalid"
        )
      ).toBe(false);
      expect(
        isSameAddress(
          "invalid",
          "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5"
        )
      ).toBe(false);
    });

    test("should handle case sensitivity", () => {
      // Substrate addresses are case-sensitive
      const address = "CpjsLDC1JFyrhm3ftC9Gs4QoyrkHKhZKtK7YqGTRFtTafgp";
      const lowerCase = "cpjsldc1jfyrhm3ftc9gs4qoyrkhhzkktk7yqgtrfttafgp";

      expect(isSameAddress(address, lowerCase)).toBe(false);
    });
  });
});
