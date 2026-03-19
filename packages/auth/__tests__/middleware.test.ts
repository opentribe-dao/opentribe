import { type AuthSession, authMiddleware } from "@packages/auth/middleware";
import { beforeEach, describe, expect, test, vi } from "vitest";

describe("Auth Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("authMiddleware", () => {
    test("should return session when valid session exists", async () => {
      const mockSession: AuthSession = {
        userId: "user-123",
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          profileCompleted: true,
          role: "USER",
        },
      };

      // Mock the fetch call
      const mockResponse = new Response(JSON.stringify(mockSession), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

      vi.spyOn(global, "fetch").mockResolvedValue(mockResponse);

      const request = new Request("http://localhost:3000/api/test");
      const session = await authMiddleware(request);

      expect(session).toEqual(mockSession);
      vi.restoreAllMocks();
    });

    test("should return null when no session exists", async () => {
      const mockResponse = new Response(JSON.stringify(null), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

      vi.spyOn(global, "fetch").mockResolvedValue(mockResponse);

      const request = new Request("http://localhost:3000/api/test");
      const session = await authMiddleware(request);

      expect(session).toBeNull();
      vi.restoreAllMocks();
    });

    test("should return null on fetch error", async () => {
      vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

      const request = new Request("http://localhost:3000/api/test");
      const session = await authMiddleware(request);

      expect(session).toBeNull();
      vi.restoreAllMocks();
    });

    test("should return null on non-ok response", async () => {
      const mockResponse = new Response("Unauthorized", {
        status: 401,
      });

      vi.spyOn(global, "fetch").mockResolvedValue(mockResponse);

      const request = new Request("http://localhost:3000/api/test");
      const session = await authMiddleware(request);

      expect(session).toBeNull();
      vi.restoreAllMocks();
    });

    test("should return null when response is not JSON", async () => {
      const mockResponse = new Response("Not JSON", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

      vi.spyOn(global, "fetch").mockResolvedValue(mockResponse);

      const request = new Request("http://localhost:3000/api/test");
      const session = await authMiddleware(request);

      expect(session).toBeNull();
      vi.restoreAllMocks();
    });

    test("should pass cookies from request to fetch", async () => {
      const mockSession: AuthSession = {
        userId: "user-456",
        user: {
          id: "user-456",
          email: "cookie@example.com",
        },
      };

      const mockResponse = new Response(JSON.stringify(mockSession), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockResolvedValue(mockResponse);

      const request = new Request("http://localhost:3000/api/test", {
        headers: {
          Cookie: "session=test-cookie-value; another=test",
        },
      });

      await authMiddleware(request);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            cookie: "session=test-cookie-value; another=test",
          }),
        })
      );
      vi.restoreAllMocks();
    });

    test("should handle empty cookies gracefully", async () => {
      const mockResponse = new Response(JSON.stringify(null), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockResolvedValue(mockResponse);

      const request = new Request("http://localhost:3000/api/test", {
        headers: {},
      });

      await authMiddleware(request);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            cookie: "",
          }),
        })
      );
      vi.restoreAllMocks();
    });
  });

  describe("AuthSession type", () => {
    test("should allow valid session structure", () => {
      const validSession: AuthSession = {
        userId: "user-123",
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          profileCompleted: true,
          role: "ADMIN",
        },
      };

      expect(validSession.userId).toBe("user-123");
      expect(validSession.user?.email).toBe("test@example.com");
    });

    test("should allow session without optional fields", () => {
      const minimalSession: AuthSession = {
        userId: "user-123",
      };

      expect(minimalSession.userId).toBe("user-123");
      expect(minimalSession.user).toBeUndefined();
    });

    test("should allow null session", () => {
      const nullSession: AuthSession = null;

      expect(nullSession).toBeNull();
    });
  });
});
