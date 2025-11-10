import { database } from "@packages/db";
import { redis } from "@packages/security/cache";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET as getRfpStats } from "../app/api/v1/rfps/stats/route";

// Mock database
vi.mock("@packages/db", () => ({
  database: {
    rFP: {
      count: vi.fn(),
    },
    grant: {
      count: vi.fn(),
    },
  },
}));

// Mock Redis cache
vi.mock("@packages/security/cache", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

describe("RFP Stats API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/rfps/stats", () => {
    test("should return RFP statistics successfully", async () => {
      // Arrange
      const mockRfpsCount = 15;
      const mockGrantsCount = 25;

      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.rFP.count).mockResolvedValue(mockRfpsCount);
      vi.mocked(database.grant.count).mockResolvedValue(mockGrantsCount);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps/stats"
      );
      const response = await getRfpStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        total_rfps_count: 15,
        total_grants_count: 25,
      });

      // Verify cache was checked and set
      expect(redis.get).toHaveBeenCalledWith("rfps:stats");
      expect(redis.set).toHaveBeenCalledWith(
        "rfps:stats",
        JSON.stringify({
          total_rfps_count: 15,
          total_grants_count: 25,
        }),
        { ex: 600 }
      );

      // Verify database calls
      expect(database.rFP.count).toHaveBeenCalledWith({
        where: {
          visibility: "PUBLISHED",
        },
      });
      expect(database.grant.count).toHaveBeenCalledWith({
        where: {
          visibility: "PUBLISHED",
        },
      });
    });

    test("should return cached data when available", async () => {
      // Arrange
      const cachedData = {
        total_rfps_count: 15,
        total_grants_count: 25,
      };

      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedData));

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps/stats"
      );
      const response = await getRfpStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(cachedData);

      // Verify cache was checked but database was NOT queried
      expect(redis.get).toHaveBeenCalledWith("rfps:stats");
      expect(database.rFP.count).not.toHaveBeenCalled();
      expect(database.grant.count).not.toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
    });

    test("should return zero for both stats when no data exists", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.rFP.count).mockResolvedValue(0);
      vi.mocked(database.grant.count).mockResolvedValue(0);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps/stats"
      );
      const response = await getRfpStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        total_rfps_count: 0,
        total_grants_count: 0,
      });
    });

    test("should handle zero RFPs but some grants", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.rFP.count).mockResolvedValue(0);
      vi.mocked(database.grant.count).mockResolvedValue(10);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps/stats"
      );
      const response = await getRfpStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        total_rfps_count: 0,
        total_grants_count: 10,
      });
    });

    test("should handle some RFPs but zero grants", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.rFP.count).mockResolvedValue(5);
      vi.mocked(database.grant.count).mockResolvedValue(0);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps/stats"
      );
      const response = await getRfpStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        total_rfps_count: 5,
        total_grants_count: 0,
      });
    });

    test("should include cache control headers", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.rFP.count).mockResolvedValue(10);
      vi.mocked(database.grant.count).mockResolvedValue(20);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps/stats"
      );
      const response = await getRfpStats(request);

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
      vi.mocked(database.rFP.count).mockResolvedValue(10);
      vi.mocked(database.grant.count).mockResolvedValue(20);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps/stats?refresh=true"
      );
      const response = await getRfpStats(request);

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

    test("should handle database RFP count error", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(database.rFP.count).mockRejectedValue(
        new Error("Database connection failed")
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps/stats"
      );
      const response = await getRfpStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch RFP statistics");
      expect(data.details).toBe("Database connection failed");
    });

    test("should handle database grant count error", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(database.rFP.count).mockResolvedValue(10);
      vi.mocked(database.grant.count).mockRejectedValue(
        new Error("Grant count query failed")
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps/stats"
      );
      const response = await getRfpStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch RFP statistics");
      expect(data.details).toBe("Grant count query failed");
    });

    test("should handle non-Error exceptions", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(database.rFP.count).mockRejectedValue("String error");

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps/stats"
      );
      const response = await getRfpStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch RFP statistics");
      expect(data.details).toBe("Unknown error");
    });

    test("should handle large counts", async () => {
      // Arrange
      const mockRfpsCount = 1000;
      const mockGrantsCount = 5000;

      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.rFP.count).mockResolvedValue(mockRfpsCount);
      vi.mocked(database.grant.count).mockResolvedValue(mockGrantsCount);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps/stats"
      );
      const response = await getRfpStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.total_rfps_count).toBe(1000);
      expect(data.total_grants_count).toBe(5000);
    });

    test("should only count published RFPs and grants", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.rFP.count).mockResolvedValue(20);
      vi.mocked(database.grant.count).mockResolvedValue(30);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps/stats"
      );
      await getRfpStats(request);

      // Assert
      expect(database.rFP.count).toHaveBeenCalledWith({
        where: {
          visibility: "PUBLISHED",
        },
      });
      expect(database.grant.count).toHaveBeenCalledWith({
        where: {
          visibility: "PUBLISHED",
        },
      });
    });

    test("should return different counts for RFPs and grants", async () => {
      // Arrange
      vi.mocked(redis.get).mockResolvedValue(null); // Cache miss
      vi.mocked(redis.set).mockResolvedValue("OK");
      vi.mocked(database.rFP.count).mockResolvedValue(5);
      vi.mocked(database.grant.count).mockResolvedValue(50);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps/stats"
      );
      const response = await getRfpStats(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.total_rfps_count).toBe(5);
      expect(data.total_grants_count).toBe(50);
      expect(data.total_rfps_count).not.toBe(data.total_grants_count);
    });
  });
});
