import { beforeEach, describe, expect, test, vi } from "vitest";

describe("API env", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  test("allows CRON_SECRET to be omitted during startup", async () => {
    delete process.env.CRON_SECRET;

    const { env } = await import("../env");

    expect(env.CRON_SECRET).toBeUndefined();
  });

  test("accepts a CRON_SECRET with at least 32 characters", async () => {
    const secret = "12345678901234567890123456789012";
    process.env.CRON_SECRET = secret;

    const { env } = await import("../env");

    expect(env.CRON_SECRET).toBe(secret);
  });

  test("rejects a CRON_SECRET shorter than 32 characters", async () => {
    process.env.CRON_SECRET = "too-short";

    await expect(import("../env")).rejects.toThrow();
  });
});
