import { beforeEach, describe, expect, test, vi } from "vitest";

const { limitMock, authGetMock, authPostMock } = vi.hoisted(() => ({
  limitMock: vi.fn(),
  authGetMock: vi.fn(async () => new Response(null, { status: 200 })),
  authPostMock: vi.fn(async () => new Response(null, { status: 200 })),
}));

vi.mock("@packages/security/rate-limit", () => ({
  createRateLimiter: vi.fn(() => ({
    limit: limitMock,
  })),
  slidingWindow: vi.fn(),
}));

vi.mock("../server", () => ({
  auth: {},
}));

vi.mock("better-auth/next-js", () => ({
  nextCookies: vi.fn(() => ({
    name: "next-cookies",
  })),
  toNextJsHandler: vi.fn(() => ({
    GET: authGetMock,
    POST: authPostMock,
  })),
}));

import { __resetLocalRateLimitStateForTests, GET, POST } from "../handlers";

describe("Auth Handlers", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    vi.clearAllMocks();
    limitMock.mockResolvedValue({ success: true });
    authGetMock.mockResolvedValue(new Response(null, { status: 200 }));
    authPostMock.mockResolvedValue(new Response(null, { status: 200 }));
    __resetLocalRateLimitStateForTests();
    process.env.NODE_ENV = originalNodeEnv;
    process.env.UPSTASH_REDIS_REST_URL = originalRedisUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = originalRedisToken;
  });

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
    test("handlers should be callable with request and params", () => {
      // Create mock request
      const _mockRequest = new Request("http://localhost:3002/api/auth/test", {
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

  describe("rate limiting", () => {
    test("applies rate limiting to email sign-in requests", async () => {
      const request = new Request(
        "http://localhost:3002/api/auth/sign-in/email",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "127.0.0.1",
          },
          body: JSON.stringify({
            email: "user@example.com",
            password: "password123",
          }),
        }
      );

      await POST(request);

      expect(limitMock).toHaveBeenCalledTimes(1);
    });

    test("returns 429 when email sign-in is rate limited", async () => {
      limitMock.mockResolvedValue({ success: false });
      const request = new Request(
        "http://localhost:3002/api/auth/sign-in/email",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "127.0.0.1",
          },
          body: JSON.stringify({
            email: "user@example.com",
            password: "password123",
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(429);
      expect(authPostMock).not.toHaveBeenCalled();
    });

    test("applies rate limiting to forgot-password requests", async () => {
      const request = new Request(
        "http://localhost:3002/api/auth/forget-password",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "127.0.0.1",
          },
          body: JSON.stringify({
            email: "user@example.com",
          }),
        }
      );

      await POST(request);

      expect(limitMock).toHaveBeenCalledTimes(1);
    });

    test("applies rate limiting to reset-password requests", async () => {
      const request = new Request(
        "http://localhost:3002/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "127.0.0.1",
          },
          body: JSON.stringify({
            email: "user@example.com",
            token: "reset-token",
          }),
        }
      );

      await POST(request);

      expect(limitMock).toHaveBeenCalledTimes(1);
    });

    test("does not rate limit unrelated auth POST routes", async () => {
      const request = new Request(
        "http://localhost:3002/api/auth/sign-up/email",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            email: "user@example.com",
            password: "password123",
          }),
        }
      );

      await POST(request);

      expect(limitMock).not.toHaveBeenCalled();
      expect(authPostMock).toHaveBeenCalledTimes(1);
    });

    test("does not rate limit GET requests", async () => {
      const request = new Request("http://localhost:3002/api/auth/session", {
        method: "GET",
      });

      await GET(request);

      expect(limitMock).not.toHaveBeenCalled();
      expect(authGetMock).toHaveBeenCalledTimes(1);
    });

    test("keeps the original request body readable downstream", async () => {
      authPostMock.mockImplementationOnce(async (request: Request) => {
        const body = await request.json();
        return Response.json(body);
      });

      const request = new Request(
        "http://localhost:3002/api/auth/sign-in/email",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "127.0.0.1",
          },
          body: JSON.stringify({
            email: "user@example.com",
            password: "password123",
          }),
        }
      );

      const response = await POST(request);

      await expect(response.json()).resolves.toEqual({
        email: "user@example.com",
        password: "password123",
      });
    });

    test("keeps auth available when Redis is unavailable", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const request = new Request(
        "http://localhost:3002/api/auth/sign-in/email",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "127.0.0.1",
          },
          body: JSON.stringify({
            email: "user@example.com",
            password: "password123",
          }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(limitMock).not.toHaveBeenCalled();
      expect(authPostMock).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        "[auth] Upstash Redis is not configured; using in-memory auth rate limiting fallback."
      );
    });

    test("uses in-memory fallback throttling when Redis is unavailable", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      vi.spyOn(console, "error").mockImplementation(() => {});

      const createRequest = () =>
        new Request("http://localhost:3002/api/auth/sign-in/email", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            email: "user@example.com",
            password: "password123",
          }),
        });

      for (let index = 0; index < 5; index += 1) {
        const response = await POST(createRequest());
        expect(response.status).toBe(200);
      }

      const blockedResponse = await POST(createRequest());

      expect(blockedResponse.status).toBe(429);
      expect(limitMock).not.toHaveBeenCalled();
      expect(authPostMock).toHaveBeenCalledTimes(5);
    });
  });
});
