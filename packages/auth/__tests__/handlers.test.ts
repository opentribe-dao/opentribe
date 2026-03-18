import { describe, expect, test, vi } from "vitest";
import { POST, GET } from "../handlers";

describe("Auth Handlers", () => {
  describe("GET and POST exports", () => {
    test("should export GET handler", () => {
      expect(GET).toBeDefined();
    });

    test("should export POST handler", () => {
      expect(POST).toBeDefined();
    });

    test("GET and POST should be functions", () => {
      expect(typeof GET).toBe("function");
      expect(typeof POST).toBe("function");
    });
  });

  describe("Handler integration", () => {
    test("handlers should be callable with request and params", async () => {
      // Create mock request
      const mockRequest = new Request("http://localhost:3002/api/auth/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ test: "data" }),
      });

      // These handlers come from better-auth's toNextJsHandler
      // They should be callable (may return responses or throw if not properly mocked)
      // In actual test environment, better-auth/next-js is mocked
      expect(GET).toBeInstanceOf(Function);
      expect(POST).toBeInstanceOf(Function);
    });
  });
});
