import { describe, expect, test } from "vitest";
import { keys } from "../keys";

describe("Security Keys", () => {
  describe("keys", () => {
    test("should create environment validation schema", () => {
      const keysFn = keys();
      expect(keysFn).toBeDefined();
    });

    test("should validate optional Redis environment variables", () => {
      // Redis is optional for rate limiting
      process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

      const keysFn = keys();
      expect(() => keysFn()).not.toThrow();
    });

    test("should work without Redis environment variables", () => {
      // Redis is optional, so missing env vars should not throw
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;

      const keysFn = keys();
      expect(() => keysFn()).not.toThrow();
    });
  });

  describe("environment variable validation", () => {
    test("UPSTASH_REDIS_REST_URL should accept valid URLs", () => {
      process.env.UPSTASH_REDIS_REST_URL =
        "https://us-east-1-1234567890.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

      const keysFn = keys();
      expect(() => keysFn()).not.toThrow();
    });

    test("UPSTASH_REDIS_REST_URL should accept http URLs", () => {
      process.env.UPSTASH_REDIS_REST_URL = "http://localhost:8080";
      process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

      const keysFn = keys();
      expect(() => keysFn()).not.toThrow();
    });

    test("UPSTASH_REDIS_REST_TOKEN should accept any string", () => {
      process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "some_random_token_12345";

      const keysFn = keys();
      expect(() => keysFn()).not.toThrow();
    });
  });
});
