import { database, Prisma } from "@packages/db";
import { redis } from "@packages/security/cache";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET as getBountyStats } from "../app/api/v1/bounties/stats/route";
import { NextRequest } from "next/server";

// Mock database
vi.mock("@packages/db", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    database: {
      bounty: {
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

describe("Bounty Stats API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/bounties/stats", () => {
    test("should return bounty statistics successfully", async () => {
      // Arrange
      const mockBountiesCount = 42;
      const mockRewardsSum = 150000;

      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.bounty.count).mockResolvedValue(mockBountiesCount);
      vi.mocked(database.bounty.aggregate).mockResolvedValue({
        _sum: {
          amountUSD: new Prisma.Decimal(mockRewardsSum),
        },
        _avg: {},
        _count: {},
        _max: {},
        _min: {},
      });

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/stats"
      );
      const response = await getBountyStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        total_bounties_count: 42,
        total_rewards: 150000,
      });

      // Verify cache was checked and set
      expect(redis.get).toHaveBeenCalledWith("bounties:stats");
      expect(redis.set).toHaveBeenCalledWith(
        "bounties:stats",
        JSON.stringify({
          total_bounties_count: 42,
          total_rewards: 150000,
        }),
        { ex: 600 }
      );

      // Verify database calls
      expect(database.bounty.count).toHaveBeenCalledWith({
        where: {
          visibility: "PUBLISHED",
        },
      });
      expect(database.bounty.aggregate).toHaveBeenCalledWith({
        where: {
          visibility: "PUBLISHED",
          status: {
            in: ["COMPLETED", "OPEN", "REVIEWING"],
          },
        },
        _sum: {
          amountUSD: true,
        },
      });
    });

    test("should return cached data when available", async () => {
      // Arrange
      const cachedData = {
        total_bounties_count: 42,
        total_rewards: 150000,
      };

      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedData));

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/stats"
      );
      const response = await getBountyStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(cachedData);

      // Verify cache was checked but database was NOT queried
      expect(redis.get).toHaveBeenCalledWith("bounties:stats");
      expect(database.bounty.count).not.toHaveBeenCalled();
      expect(database.bounty.aggregate).not.toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
    });

    test("should return zero rewards when no completed bounties exist", async () => {
      // Arrange
      const mockBountiesCount = 10;

      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.bounty.count).mockResolvedValue(mockBountiesCount);
      vi.mocked(database.bounty.aggregate).mockResolvedValue({
        _sum: {
          amount: null, // No completed bounties
        },
        _avg: {},
        _count: {},
        _max: {},
        _min: {},
      });

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/stats"
      );
      const response = await getBountyStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        total_bounties_count: 10,
        total_rewards: 0,
      });
    });

    test("should return zero for both stats when no data exists", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.bounty.count).mockResolvedValue(0);
      vi.mocked(database.bounty.aggregate).mockResolvedValue({
        _sum: {
          amountUSD: null,
        },
        _avg: {},
        _count: {},
        _max: {},
        _min: {},
      });

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/stats"
      );
      const response = await getBountyStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        total_bounties_count: 0,
        total_rewards: 0,
      });
    });

    test("should include cache control headers", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.bounty.count).mockResolvedValue(5);
      vi.mocked(database.bounty.aggregate).mockResolvedValue({
        _sum: {
          amountUSD: new Prisma.Decimal(10000),
        },
        _avg: {},
        _count: {},
        _max: {},
        _min: {},
      });

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/stats"
      );
      const response = await getBountyStats(request);

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe(
        "s-maxage=1800, max-age=600"
      );
    });

    test("should bypass cache when refresh parameter is true", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Not called when refresh=true
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.bounty.count).mockResolvedValue(5);
      vi.mocked(database.bounty.aggregate).mockResolvedValue({
        _sum: {
          amountUSD: new Prisma.Decimal(10000),
        },
        _avg: {},
        _count: {},
        _max: {},
        _min: {},
      });

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/stats?refresh=true"
      );
      const response = await getBountyStats(request);

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe(
        "s-maxage=1800, max-age=600"
      );
      // Redis get should not be called when refresh=true
      expect(redis.get).not.toHaveBeenCalled();
      // But should still cache the fresh data
      expect(redis.set).toHaveBeenCalled();
    });

    test("should handle database count error", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(database.bounty.count).mockRejectedValue(
        new Error("Database connection failed")
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/stats"
      );
      const response = await getBountyStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch bounty statistics");
      expect(data.details).toBe("Database connection failed");
    });

    test("should handle database aggregate error", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(database.bounty.count).mockResolvedValue(10);
      vi.mocked(database.bounty.aggregate).mockRejectedValue(
        new Error("Aggregate query failed")
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/stats"
      );
      const response = await getBountyStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch bounty statistics");
      expect(data.details).toBe("Aggregate query failed");
    });

    test("should handle non-Error exceptions", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(database.bounty.count).mockRejectedValue("String error");

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/stats"
      );
      const response = await getBountyStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch bounty statistics");
      expect(data.details).toBe("Unknown error");
    });

    test("should handle large reward amounts", async () => {
      // Arrange
      const mockBountiesCount = 100;
      const mockRewardsSum = 999999999.99;

      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.bounty.count).mockResolvedValue(mockBountiesCount);
      vi.mocked(database.bounty.aggregate).mockResolvedValue({
        _sum: {
          amountUSD: new Prisma.Decimal(mockRewardsSum),
        },
        _avg: {},
        _count: {},
        _max: {},
        _min: {},
      });

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/stats"
      );
      const response = await getBountyStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.total_bounties_count).toBe(100);
      expect(data.total_rewards).toBe(999999999.99);
    });
  });
});
