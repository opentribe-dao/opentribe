import { Redis } from "@upstash/redis";
import { keys } from "./keys";

const url = keys().UPSTASH_REDIS_REST_URL;
const token = keys().UPSTASH_REDIS_REST_TOKEN;

const isRedisConfigured = url && token;

if (!isRedisConfigured) {
  console.warn(
    "[security/cache] Redis not configured - caching disabled. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable."
  );
}

/**
 * Redis client for caching.
 *
 * When Redis is not configured (local development), returns a no-op client that:
 * - Returns null for reads (cache miss)
 * - Returns "OK" for writes (succeeds silently)
 * - Logs a warning on initialization
 *
 * This is intentional - caching is optional and the app should work without it.
 * Production deployments MUST configure Redis for proper caching behavior.
 */
export const redis = isRedisConfigured
  ? new Redis({ url, token })
  : (new Proxy(
      {},
      {
        get: (_, prop) => {
          return () => {
            // Writes succeed silently (caching is optional)
            if (prop === "set") {
              return Promise.resolve("OK");
            }
            if (prop === "del") {
              return Promise.resolve(1);
            }
            if (prop === "keys") {
              return Promise.resolve([]);
            }
            if (prop === "ttl") {
              return Promise.resolve(-1);
            }
            // Reads return null (cache miss - caller should handle)
            return Promise.resolve(null);
          };
        },
      }
    ) as unknown as Redis);
