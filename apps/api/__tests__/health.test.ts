import { beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  GET as healthGet,
  HEAD as healthHead,
  OPTIONS as healthOptions,
} from "../app/health/route";

// Mock database module used by the health route
vi.mock("@packages/db", () => ({
  database: {
    $queryRaw: vi.fn(),
  },
}));

// Import mocked database for type-safe mocking
import { database } from "@packages/db";

describe("/health route", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    delete process.env.NEXT_PUBLIC_GIT_SHA;
  });

  test("GET returns JSON with ok status and headers when DB is healthy", async () => {
    vi.mocked(database.$queryRaw).mockResolvedValueOnce(1 as any);

    // include a fake commit sha via env to assert header propagation
    process.env.NEXT_PUBLIC_GIT_SHA = "abc123";

    const request = new NextRequest("http://localhost:3002/health");
    const response = await healthGet(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.status).toBe("ok");
    expect(json.data.runtime).toBe("nodejs");
    expect(typeof json.data.timestamp).toBe("string");
    expect(typeof json.data.uptime).toBe("string");
    expect(json.data.uptime.includes("hrs")).toBe(true);
    expect(json.data.git.commitSha).toBe("abc123");
    expect(json.data.checks.database).toBe("ok");
    expect(typeof json.data.checks.databaseLatencyMs === "number").toBe(true);

    // headers
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Api-Version")).toBe("v1");
    expect(response.headers.get("X-Commit-Sha")).toBe("abc123");
  });

  test("GET returns degraded and 503 when DB ping fails", async () => {
    vi.mocked(database.$queryRaw).mockRejectedValueOnce(new Error("db down"));

    const request = new NextRequest("http://localhost:3002/health");
    const response = await healthGet(request as any);
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.data.status).toBe("degraded");
    expect(json.data.checks.database).toBe("fail");
    expect(json.data.checks.databaseLatencyMs).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  test("GET ?format=plain returns OK text with no-store cache", async () => {
    const request = new NextRequest(
      "http://localhost:3002/health?format=plain"
    );
    const response = await healthGet(request as any);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toBe("OK");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  test("HEAD returns 204 with no-store", async () => {
    const response = await healthHead();
    expect(response.status).toBe(204);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  test("OPTIONS returns 204 with no-store", async () => {
    const response = await healthOptions();
    expect(response.status).toBe(204);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
