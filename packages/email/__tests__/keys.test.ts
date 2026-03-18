import { describe, expect, test } from "vitest";
import { keys } from "../keys";

describe("Email Keys", () => {
  describe("keys", () => {
    test("should create environment validation schema", () => {
      const keysFn = keys();
      expect(keysFn).toBeDefined();
    });

    test("should validate required environment variables", () => {
      process.env.RESEND_TOKEN = "re_test123456789";
      process.env.RESEND_FROM = "test@example.com";

      const keysFn = keys();
      expect(() => keysFn()).not.toThrow();
    });

    test("should provide default audience ID", () => {
      process.env.RESEND_TOKEN = "re_test123456789";
      process.env.RESEND_FROM = "test@example.com";
      // RESEND_GENERAL_AUDIENCE_ID has a default value

      const keysFn = keys();
      const result = keysFn();
      expect(result.RESEND_GENERAL_AUDIENCE_ID).toBe(
        "fca6d77f-e6ed-4d07-88c5-0ea4e774705a"
      );
    });
  });

  describe("environment variable validation", () => {
    test("RESEND_TOKEN should start with re_", () => {
      process.env.RESEND_TOKEN = "re_123456789";
      process.env.RESEND_FROM = "test@example.com";

      const keysFn = keys();
      expect(() => keysFn()).not.toThrow();
    });

    test("RESEND_TOKEN should reject invalid format", () => {
      process.env.RESEND_TOKEN = "invalid_token";
      process.env.RESEND_FROM = "test@example.com";

      const keysFn = keys();
      expect(() => keysFn()).toThrow();
    });

    test("RESEND_FROM should be a valid email", () => {
      process.env.RESEND_TOKEN = "re_test123456789";
      process.env.RESEND_FROM = "not-an-email";

      const keysFn = keys();
      expect(() => keysFn()).toThrow();
    });

    test("RESEND_FROM should accept valid email formats", () => {
      process.env.RESEND_TOKEN = "re_test123456789";
      process.env.RESEND_FROM = "hello@notifications.opentribe.io";

      const keysFn = keys();
      expect(() => keysFn()).not.toThrow();
    });

    test("should accept custom audience ID", () => {
      process.env.RESEND_TOKEN = "re_test123456789";
      process.env.RESEND_FROM = "test@example.com";
      process.env.RESEND_GENERAL_AUDIENCE_ID = "custom-audience-id-123";

      const keysFn = keys();
      const result = keysFn();
      expect(result.RESEND_GENERAL_AUDIENCE_ID).toBe("custom-audience-id-123");
    });
  });
});
