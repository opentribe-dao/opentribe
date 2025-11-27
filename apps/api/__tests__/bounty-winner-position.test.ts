import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { PATCH as assignPosition } from "../app/api/v1/bounties/[id]/submissions/[submissionId]/position/route";

// Mock exchangeRateService
vi.mock("@packages/polkadot/server", () => ({
  exchangeRateService: {
    getExchangeRates: vi.fn(),
  },
}));

// Import after mock
import { exchangeRateService } from "@packages/polkadot/server";

describe("Position Assignment Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH /api/v1/bounties/[id]/submissions/[submissionId]/position", () => {
    test("should assign position and calculate winningAmountUSD successfully", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "admin@example.com",
        },
      };

      const mockSubmission = {
        id: "submission-1",
        bountyId: "bounty-1",
        userId: "submitter-123",
        status: "SUBMITTED",
        bounty: {
          id: "bounty-1",
          title: "Test Bounty",
          organizationId: "org-1",
          token: "DOT",
          winnings: {
            "1": 1000,
            "2": 500,
          },
        },
      };

      const mockUpdatedSubmission = {
        id: "submission-1",
        position: 1,
        winningAmount: 1000,
        winningAmountUSD: 7000, // 1000 * 7 (mock rate)
        isWinner: true,
        bounty: {
          id: "bounty-1",
          title: "Test Bounty",
          organizationId: "org-1",
        },
        submitter: {
          id: "submitter-123",
          username: "submitter",
          email: "submitter@example.com",
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);
      (database.member.findFirst as any).mockResolvedValue({
        id: "member-1",
        userId: "user-123",
        organizationId: "org-1",
        role: "admin",
      });
      (exchangeRateService.getExchangeRates as any).mockResolvedValue({
        DOT: 7.0,
      });
      (database.submission.findFirst as any)
        .mockResolvedValueOnce(null) // No existing winner at position
        .mockResolvedValueOnce(mockUpdatedSubmission); // Return updated submission
      (database.submission.update as any).mockResolvedValue(mockUpdatedSubmission);
      (database.$transaction as any).mockImplementation(async (callback) => {
        return await callback({
          submission: {
            findFirst: database.submission.findFirst,
            update: database.submission.update,
          },
        });
      });

      // Act
      const body = JSON.stringify({ position: 1 });
      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions/submission-1/position",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await assignPosition(request, {
        params: Promise.resolve({ id: "bounty-1", submissionId: "submission-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.submission.position).toBe(1);
      expect(data.submission.winningAmount).toBe(1000);
      expect(data.submission.winningAmountUSD).toBe(7000);
      expect(exchangeRateService.getExchangeRates).toHaveBeenCalledWith(["DOT"]);
    });

    test("should clear position and set winningAmountUSD to null", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "admin@example.com",
        },
      };

      const mockSubmission = {
        id: "submission-1",
        bountyId: "bounty-1",
        userId: "submitter-123",
        status: "SUBMITTED",
        position: 1,
        winningAmount: 1000,
        winningAmountUSD: 7000,
        bounty: {
          id: "bounty-1",
          title: "Test Bounty",
          organizationId: "org-1",
          token: "DOT",
          winnings: {},
        },
      };

      const mockUpdatedSubmission = {
        ...mockSubmission,
        position: null,
        winningAmount: null,
        winningAmountUSD: null,
        isWinner: false,
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);
      (database.member.findFirst as any).mockResolvedValue({
        id: "member-1",
        userId: "user-123",
        organizationId: "org-1",
        role: "admin",
      });
      (database.submission.update as any).mockResolvedValue(mockUpdatedSubmission);
      (database.$transaction as any).mockImplementation(async (callback) => {
        return await callback({
          submission: {
            findFirst: database.submission.findFirst,
            update: database.submission.update,
          },
        });
      });

      // Act
      const body = JSON.stringify({ position: null });
      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions/submission-1/position",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await assignPosition(request, {
        params: Promise.resolve({ id: "bounty-1", submissionId: "submission-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.submission.position).toBeNull();
      expect(data.submission.winningAmount).toBeNull();
      expect(data.submission.winningAmountUSD).toBeNull();
      expect(exchangeRateService.getExchangeRates).not.toHaveBeenCalled();
    });

    test("should resolve position conflict by clearing previous submission", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "admin@example.com",
        },
      };

      const mockSubmission = {
        id: "submission-1",
        bountyId: "bounty-1",
        userId: "submitter-123",
        status: "SUBMITTED",
        bounty: {
          id: "bounty-1",
          title: "Test Bounty",
          organizationId: "org-1",
          token: "DOT",
          winnings: { "1": 1000 },
        },
      };

      const mockExistingWinner = {
        id: "submission-2",
        position: 1,
        winningAmount: 1000,
        winningAmountUSD: 7000,
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);
      (database.member.findFirst as any).mockResolvedValue({
        id: "member-1",
        userId: "user-123",
        organizationId: "org-1",
        role: "admin",
      });
      (exchangeRateService.getExchangeRates as any).mockResolvedValue({
        DOT: 7.0,
      });
      (database.submission.findFirst as any).mockResolvedValue(mockExistingWinner);
      (database.submission.update as any).mockResolvedValue({});
      (database.$transaction as any).mockImplementation(async (callback) => {
        return await callback({
          submission: {
            findFirst: database.submission.findFirst,
            update: database.submission.update,
          },
        });
      });

      // Act
      const body = JSON.stringify({ position: 1 });
      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions/submission-1/position",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await assignPosition(request, {
        params: Promise.resolve({ id: "bounty-1", submissionId: "submission-1" }),
      });

      // Assert
      expect(response.status).toBe(200);
      expect(database.submission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "submission-2" },
          data: expect.objectContaining({
            position: null,
            winningAmount: null,
            winningAmountUSD: null,
            isWinner: false,
          }),
        })
      );
    });

    test("should reject invalid position (not in winnings)", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "admin@example.com",
        },
      };

      const mockSubmission = {
        id: "submission-1",
        bountyId: "bounty-1",
        userId: "submitter-123",
        status: "SUBMITTED",
        bounty: {
          id: "bounty-1",
          title: "Test Bounty",
          organizationId: "org-1",
          token: "DOT",
          winnings: { "1": 1000 },
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);
      (database.member.findFirst as any).mockResolvedValue({
        id: "member-1",
        userId: "user-123",
        organizationId: "org-1",
        role: "admin",
      });

      // Act
      const body = JSON.stringify({ position: 99 });
      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions/submission-1/position",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await assignPosition(request, {
        params: Promise.resolve({ id: "bounty-1", submissionId: "submission-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid winner position");
    });

    test("should reject winningAmount <= 0", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "admin@example.com",
        },
      };

      const mockSubmission = {
        id: "submission-1",
        bountyId: "bounty-1",
        userId: "submitter-123",
        status: "SUBMITTED",
        bounty: {
          id: "bounty-1",
          title: "Test Bounty",
          organizationId: "org-1",
          token: "DOT",
          winnings: { "1": 0 }, // Invalid: amount is 0
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);
      (database.member.findFirst as any).mockResolvedValue({
        id: "member-1",
        userId: "user-123",
        organizationId: "org-1",
        role: "admin",
      });

      // Act
      const body = JSON.stringify({ position: 1 });
      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions/submission-1/position",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await assignPosition(request, {
        params: Promise.resolve({ id: "bounty-1", submissionId: "submission-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid winning amount: must be greater than 0");
    });

    test("should reject unauthorized user", async () => {
      // Arrange
      (auth.api.getSession as any).mockResolvedValue(null);

      // Act
      const body = JSON.stringify({ position: 1 });
      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions/submission-1/position",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await assignPosition(request, {
        params: Promise.resolve({ id: "bounty-1", submissionId: "submission-1" }),
      });

      // Assert
      expect(response.status).toBe(401);
    });

    test("should reject user without organization membership", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "user@example.com",
        },
      };

      const mockSubmission = {
        id: "submission-1",
        bountyId: "bounty-1",
        userId: "submitter-123",
        status: "SUBMITTED",
        bounty: {
          id: "bounty-1",
          title: "Test Bounty",
          organizationId: "org-1",
          token: "DOT",
          winnings: { "1": 1000 },
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);
      (database.member.findFirst as any).mockResolvedValue(null); // Not a member

      // Act
      const body = JSON.stringify({ position: 1 });
      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions/submission-1/position",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await assignPosition(request, {
        params: Promise.resolve({ id: "bounty-1", submissionId: "submission-1" }),
      });

      // Assert
      expect(response.status).toBe(401);
    });

    test("should reject user with member role (requires admin/owner)", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "member@example.com",
        },
      };

      const mockSubmission = {
        id: "submission-1",
        bountyId: "bounty-1",
        userId: "submitter-123",
        status: "SUBMITTED",
        bounty: {
          id: "bounty-1",
          title: "Test Bounty",
          organizationId: "org-1",
          token: "DOT",
          winnings: { "1": 1000 },
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);
      (database.member.findFirst as any).mockResolvedValue({
        id: "member-1",
        userId: "user-123",
        organizationId: "org-1",
        role: "member", // Not admin/owner
      });

      // Act
      const body = JSON.stringify({ position: 1 });
      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions/submission-1/position",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await assignPosition(request, {
        params: Promise.resolve({ id: "bounty-1", submissionId: "submission-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toBe("You don't have permission to assign positions");
    });

    test("should handle exchange rate fetch failure", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "admin@example.com",
        },
      };

      const mockSubmission = {
        id: "submission-1",
        bountyId: "bounty-1",
        userId: "submitter-123",
        status: "SUBMITTED",
        bounty: {
          id: "bounty-1",
          title: "Test Bounty",
          organizationId: "org-1",
          token: "DOT",
          winnings: { "1": 1000 },
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);
      (database.member.findFirst as any).mockResolvedValue({
        id: "member-1",
        userId: "user-123",
        organizationId: "org-1",
        role: "admin",
      });
      (exchangeRateService.getExchangeRates as any).mockRejectedValue(
        new Error("API error")
      );

      // Act
      const body = JSON.stringify({ position: 1 });
      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions/submission-1/position",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await assignPosition(request, {
        params: Promise.resolve({ id: "bounty-1", submissionId: "submission-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toContain("Failed to fetch exchange rate");
    });

    test("should handle invalid exchange rate (rate <= 0)", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "admin@example.com",
        },
      };

      const mockSubmission = {
        id: "submission-1",
        bountyId: "bounty-1",
        userId: "submitter-123",
        status: "SUBMITTED",
        bounty: {
          id: "bounty-1",
          title: "Test Bounty",
          organizationId: "org-1",
          token: "DOT",
          winnings: { "1": 1000 },
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);
      (database.member.findFirst as any).mockResolvedValue({
        id: "member-1",
        userId: "user-123",
        organizationId: "org-1",
        role: "admin",
      });
      (exchangeRateService.getExchangeRates as any).mockResolvedValue({
        DOT: 0, // Invalid rate
      });

      // Act
      const body = JSON.stringify({ position: 1 });
      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions/submission-1/position",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await assignPosition(request, {
        params: Promise.resolve({ id: "bounty-1", submissionId: "submission-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toContain("Failed to fetch exchange rate");
    });

    test("should handle missing token in bounty", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "admin@example.com",
        },
      };

      const mockSubmission = {
        id: "submission-1",
        bountyId: "bounty-1",
        userId: "submitter-123",
        status: "SUBMITTED",
        bounty: {
          id: "bounty-1",
          title: "Test Bounty",
          organizationId: "org-1",
          token: null, // No token
          winnings: { "1": 1000 },
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);
      (database.member.findFirst as any).mockResolvedValue({
        id: "member-1",
        userId: "user-123",
        organizationId: "org-1",
        role: "admin",
      });

      // Act
      const body = JSON.stringify({ position: 1 });
      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions/submission-1/position",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await assignPosition(request, {
        params: Promise.resolve({ id: "bounty-1", submissionId: "submission-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toContain("Failed to fetch exchange rate");
      expect(exchangeRateService.getExchangeRates).not.toHaveBeenCalled();
    });

    test("should reject invalid request body", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "admin@example.com",
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);

      // Act
      const body = JSON.stringify({ position: "invalid" }); // Invalid type
      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions/submission-1/position",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await assignPosition(request, {
        params: Promise.resolve({ id: "bounty-1", submissionId: "submission-1" }),
      });

      // Assert
      expect(response.status).toBe(400);
    });
  });
});

