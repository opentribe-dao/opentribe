import { database } from "@packages/db";
import { redis } from "@packages/security/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET as getGrantStats } from "../app/api/v1/grants/stats/route";
import { NextRequest } from "next/server";

// Mock database
vi.mock("@packages/db", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    database: {
      grant: {
        count: vi.fn(),
        aggregate: vi.fn(),
      },
    },
  };
});

// Mock Redis cache
vi.mock("@packages/security/cache", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe("Grant Stats API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/grants/stats", () => {
    test("should return grant statistics successfully", async () => {
      // Arrange
      const mockGrantsCount = 25;
      const mockTotalFunds = 5000000;

      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.grant.count).mockResolvedValue(mockGrantsCount);
      vi.mocked(database.grant.aggregate).mockResolvedValue({
        _sum: {
          totalFunds: mockTotalFunds,
        },
        _avg: {},
        _count: {},
        _max: {},
        _min: {},
      });

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants/stats"
      );
      const response = await getGrantStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        total_grants_count: 25,
        total_funds: 5000000,
      });

      // Verify cache was checked and set
      expect(redis.get).toHaveBeenCalledWith("grants:stats");
      expect(redis.set).toHaveBeenCalledWith(
        "grants:stats",
        JSON.stringify({
          total_grants_count: 25,
          total_funds: 5000000,
        }),
        { ex: 1800 }
      );

      // Verify database calls
      expect(database.grant.count).toHaveBeenCalledWith({
        where: {
          visibility: "PUBLISHED",
        },
      });
      expect(database.grant.aggregate).toHaveBeenCalledWith({
        where: {
          visibility: "PUBLISHED",
        },
        _sum: {
          totalFunds: true,
        },
      });
    });

    test("should return cached data when available", async () => {
      // Arrange
      const cachedData = {
        total_grants_count: 25,
        total_funds: 5000000,
      };

      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedData));

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants/stats"
      );
      const response = await getGrantStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(cachedData);

      // Verify cache was checked but database was NOT queried
      expect(redis.get).toHaveBeenCalledWith("grants:stats");
      expect(database.grant.count).not.toHaveBeenCalled();
      expect(database.grant.aggregate).not.toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
    });

    test("should return zero funds when no grants have funds", async () => {
      // Arrange
      const mockGrantsCount = 5;

      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.grant.count).mockResolvedValue(mockGrantsCount);
      vi.mocked(database.grant.aggregate).mockResolvedValue({
        _sum: {
          totalFunds: null, // No funds
        },
        _avg: {},
        _count: {},
        _max: {},
        _min: {},
      });

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants/stats"
      );
      const response = await getGrantStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        total_grants_count: 5,
        total_funds: 0,
      });
    });

    test("should return zero for both stats when no data exists", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.grant.count).mockResolvedValue(0);
      vi.mocked(database.grant.aggregate).mockResolvedValue({
        _sum: {
          totalFunds: null,
        },
        _avg: {},
        _count: {},
        _max: {},
        _min: {},
      });

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants/stats"
      );
      const response = await getGrantStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        total_grants_count: 0,
        total_funds: 0,
      });
    });

    test("should include cache control headers", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.grant.count).mockResolvedValue(10);
      vi.mocked(database.grant.aggregate).mockResolvedValue({
        _sum: {
          totalFunds: 1000000,
        },
        _avg: {},
        _count: {},
        _max: {},
        _min: {},
      });

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants/stats"
      );
      const response = await getGrantStats(request);

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe(
        "s-maxage=1800, max-age=1800"
      );
    });

    test("should bypass cache when refresh parameter is true", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Not called when refresh=true
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.grant.count).mockResolvedValue(10);
      vi.mocked(database.grant.aggregate).mockResolvedValue({
        _sum: {
          totalFunds: 1000000,
        },
        _avg: {},
        _count: {},
        _max: {},
        _min: {},
      });

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants/stats?refresh=true"
      );
      const response = await getGrantStats(request);

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe(
        "s-maxage=1800, max-age=1800"
      );
      // Redis get should not be called when refresh=true
      expect(redis.get).not.toHaveBeenCalled();
      // But should still cache the fresh data
      expect(redis.set).toHaveBeenCalled();
    });

    test("should handle database count error", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(database.grant.count).mockRejectedValue(
        new Error("Database connection failed")
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants/stats"
      );
      const response = await getGrantStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch grant statistics");
      expect(data.details).toBe("Database connection failed");
    });

    test("should handle database aggregate error", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(database.grant.count).mockResolvedValue(10);
      vi.mocked(database.grant.aggregate).mockRejectedValue(
        new Error("Aggregate query failed")
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants/stats"
      );
      const response = await getGrantStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch grant statistics");
      expect(data.details).toBe("Aggregate query failed");
    });

    test("should handle non-Error exceptions", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(database.grant.count).mockRejectedValue("String error");

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants/stats"
      );
      const response = await getGrantStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch grant statistics");
      expect(data.details).toBe("Unknown error");
    });

    test("should handle large fund amounts", async () => {
      // Arrange
      const mockGrantsCount = 50;
      const mockTotalFunds = 45000000; // 45 million

      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.grant.count).mockResolvedValue(mockGrantsCount);
      vi.mocked(database.grant.aggregate).mockResolvedValue({
        _sum: {
          totalFunds: mockTotalFunds,
        },
        _avg: {},
        _count: {},
        _max: {},
        _min: {},
      });

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants/stats"
      );
      const response = await getGrantStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.total_grants_count).toBe(50);
      expect(data.total_funds).toBe(45000000);
    });

    test("should only count published grants", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.grant.count).mockResolvedValue(15);
      vi.mocked(database.grant.aggregate).mockResolvedValue({
        _sum: {
          totalFunds: 3000000,
        },
        _avg: {},
        _count: {},
        _max: {},
        _min: {},
      });

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants/stats"
      );
      await getGrantStats(request);

      // Assert
      expect(database.grant.count).toHaveBeenCalledWith({
        where: {
          visibility: "PUBLISHED",
        },
      });
      expect(database.grant.aggregate).toHaveBeenCalledWith({
        where: {
          visibility: "PUBLISHED",
        },
        _sum: {
          totalFunds: true,
        },
      });
    });
  });
});
