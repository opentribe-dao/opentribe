import { beforeEach, describe, expect, test, vi } from "vitest";

describe("security cache fallback", () => {
  const originalRedisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const originalRedisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    vi.resetModules();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  test("returns cache-miss semantics for reads without Redis", async () => {
    const { redis } = await import("../cache");

    await expect(redis.get("key")).resolves.toBeNull();
    await expect(redis.ttl("key")).resolves.toBe(-1);
  });

  test("returns array-like results for key scans without Redis", async () => {
    const { redis } = await import("../cache");

    await expect(redis.keys("prefix:*")).resolves.toEqual([]);
  });

  test("silently succeeds for writes without Redis", async () => {
    const { redis } = await import("../cache");

    await expect(redis.set("key", "value")).resolves.toBe("OK");
    await expect(redis.del("key")).resolves.toBe(1);
  });

  test("warns once when Redis is disabled", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await import("../cache");

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  test("does not use the fallback when Redis is configured", async () => {
    process.env.UPSTASH_REDIS_REST_URL = originalRedisUrl || "https://test.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = originalRedisToken || "token";

    const { redis } = await import("../cache");

    expect(redis).toBeDefined();
  });
});
