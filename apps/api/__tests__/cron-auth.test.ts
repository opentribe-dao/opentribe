import { beforeEach, describe, expect, test, vi } from "vitest";

describe("validateCronAuth", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    process.env.CRON_SECRET = originalCronSecret;
  });

  test("returns 500 when CRON_SECRET is missing", async () => {
    delete process.env.CRON_SECRET;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { validateCronAuth } = await import("../lib/cron-auth");

    const response = validateCronAuth(
      new Request("http://localhost:3002/cron/test", {
        headers: {
          authorization: "Bearer anything",
        },
      })
    );

    expect(response?.status).toBe(500);
    await expect(response?.json()).resolves.toEqual({
      error: "Internal server configuration error",
    });
    expect(errorSpy).toHaveBeenCalledWith(
      "CRON_SECRET environment variable is not set"
    );
  });

  test("returns 401 when authorization header is missing", async () => {
    process.env.CRON_SECRET = "test-cron-secret-key-for-testing-min-32-chars";
    const { validateCronAuth } = await import("../lib/cron-auth");

    const response = validateCronAuth(
      new Request("http://localhost:3002/cron/test")
    );

    expect(response?.status).toBe(401);
    await expect(response?.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  test("returns 401 when bearer token is invalid", async () => {
    process.env.CRON_SECRET = "test-cron-secret-key-for-testing-min-32-chars";
    const { validateCronAuth } = await import("../lib/cron-auth");

    const response = validateCronAuth(
      new Request("http://localhost:3002/cron/test", {
        headers: {
          authorization: "Bearer wrong-cron-secret-key-for-testing-min-32",
        },
      })
    );

    expect(response?.status).toBe(401);
    await expect(response?.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  test("returns 401 when authorization scheme is not bearer", async () => {
    process.env.CRON_SECRET = "test-cron-secret-key-for-testing-min-32-chars";
    const { validateCronAuth } = await import("../lib/cron-auth");

    const response = validateCronAuth(
      new Request("http://localhost:3002/cron/test", {
        headers: {
          authorization: "Basic test-cron-secret-key-for-testing-min-32-chars",
        },
      })
    );

    expect(response?.status).toBe(401);
  });

  test("returns null for a valid bearer token", async () => {
    const secret = "test-cron-secret-key-for-testing-min-32-chars";
    process.env.CRON_SECRET = secret;
    const { validateCronAuth } = await import("../lib/cron-auth");

    const response = validateCronAuth(
      new Request("http://localhost:3002/cron/test", {
        headers: {
          authorization: `Bearer ${secret}`,
        },
      })
    );

    expect(response).toBeNull();
  });

  test("returns 401 for same-length invalid tokens", async () => {
    const secret = "test-cron-secret-key-for-testing-min-32-chars";
    process.env.CRON_SECRET = secret;
    const { validateCronAuth } = await import("../lib/cron-auth");

    const response = validateCronAuth(
      new Request("http://localhost:3002/cron/test", {
        headers: {
          authorization: "Bearer test-cron-secret-key-for-testing-min-32-charx",
        },
      })
    );

    expect(response?.status).toBe(401);
  });
});
