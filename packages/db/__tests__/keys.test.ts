import { describe, expect, test } from "vitest";
import { keys } from "../keys";

describe("Database Keys", () => {
  describe("keys", () => {
    test("should create environment validation schema", () => {
      const keysFn = keys();
      expect(keysFn).toBeDefined();
    });

    test("should validate DATABASE_URL", () => {
      process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

      const keysFn = keys();
      expect(() => keysFn()).not.toThrow();
    });

    test("should accept postgresql:// URLs", () => {
      process.env.DATABASE_URL =
        "postgresql://user:password@localhost:5432/mydb";
      const keysFn = keys();
      expect(() => keysFn()).not.toThrow();
    });

    test("should accept postgres:// URLs (alternative protocol)", () => {
      process.env.DATABASE_URL = "postgres://user:password@localhost:5432/mydb";
      const keysFn = keys();
      expect(() => keysFn()).not.toThrow();
    });

    test("should accept Neon serverless URLs", () => {
      process.env.DATABASE_URL =
        "postgresql://user:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require";
      const keysFn = keys();
      expect(() => keysFn()).not.toThrow();
    });
  });

  describe("environment variable requirements", () => {
    test("should require DATABASE_URL to be a valid URL", () => {
      process.env.DATABASE_URL = "not-a-valid-url";
      const keysFn = keys();
      expect(() => keysFn()).toThrow();
    });

    test("should handle URLs with special characters", () => {
      process.env.DATABASE_URL =
        "postgresql://user:p%40ssw0rd!@localhost:5432/testdb";
      const keysFn = keys();
      expect(() => keysFn()).not.toThrow();
    });

    test("should handle URLs with query parameters", () => {
      process.env.DATABASE_URL =
        "postgresql://user:pass@localhost:5432/db?sslmode=require&connect_timeout=10";
      const keysFn = keys();
      expect(() => keysFn()).not.toThrow();
    });
  });
});
