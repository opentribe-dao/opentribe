import { database } from "@packages/db";
import { sendBountyWinnerReminderEmail } from "@packages/email";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET as bountyDeadlineCron } from "../app/cron/bounty-deadline-passed/route";

// Mock database
vi.mock("@packages/db", () => ({
  database: {
    bounty: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

// Mock email service
vi.mock("@packages/email", () => ({
  sendBountyWinnerReminderEmail: vi.fn(),
}));

describe("Bounty Deadline Passed Cron Job", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /cron/bounty-deadline-passed", () => {
    const mockExpiredBounty = {
      id: "bounty-1",
      title: "Test Bounty",
      deadline: new Date("2024-01-01T00:00:00.000Z"),
      submissionCount: 5,
      amount: 1000,
      token: "DOT",
      curators: [
        {
          user: {
            email: "admin@org.com",
            firstName: "Admin",
            username: "admin",
          },
        },
        {
          user: {
            email: "owner@org.com",
            firstName: "Owner",
            username: "owner",
          },
        },
      ],
    };

    const mockExpiredBountyNoSubmissions = {
      id: "bounty-2",
      title: "Test Bounty No Submissions",
      deadline: new Date("2024-01-01T00:00:00.000Z"),
      submissionCount: 0,
      amount: 500,
      token: "DOT",
      curators: [
        {
          user: {
            email: "admin@org.com",
            firstName: "Admin",
            username: "admin",
          },
        },
      ],
    };

    test("should successfully update expired bounties to REVIEWING status", async () => {
      // Arrange
      const mockBounties = [mockExpiredBounty];
      const mockUpdateResult = { count: 1 };

      vi.mocked(database.bounty.findMany).mockResolvedValue(
        mockBounties as any
      );
      vi.mocked(database.bounty.updateMany).mockResolvedValue(mockUpdateResult);
      vi.mocked(sendBountyWinnerReminderEmail).mockResolvedValue({} as any);

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe(
        "Successfully updated 1 bounties to REVIEWING status"
      );
      expect(data.totalCount).toBe(1);
      expect(data.updatedBounties).toHaveLength(1);
      expect(data.updatedBounties[0]).toEqual({
        id: "bounty-1",
        title: "Test Bounty",
        deadline: "2024-01-01T00:00:00.000Z",
        submissionCount: 5,
      });

      // Verify database calls
      expect(database.bounty.findMany).toHaveBeenCalledWith({
        where: {
          status: "OPEN",
          deadline: {
            lte: expect.any(Date),
          },
          visibility: "PUBLISHED",
        },
        include: {
          curators: {
            include: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      expect(database.bounty.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ["bounty-1"],
          },
        },
        data: {
          status: "REVIEWING",
          updatedAt: expect.any(Date),
        },
      });
    });

    test("should send reminder emails to bounty curators", async () => {
      // Arrange
      const mockBounties = [mockExpiredBounty];
      const mockUpdateResult = { count: 1 };

      vi.mocked(database.bounty.findMany).mockResolvedValue(
        mockBounties as any
      );
      vi.mocked(database.bounty.updateMany).mockResolvedValue(mockUpdateResult);
      vi.mocked(sendBountyWinnerReminderEmail).mockResolvedValue({} as any);

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.emailsSent).toBe(1);

      // Verify emails were sent to both curators
      expect(sendBountyWinnerReminderEmail).toHaveBeenCalledTimes(2);
      expect(sendBountyWinnerReminderEmail).toHaveBeenCalledWith(
        {
          email: "admin@org.com",
          firstName: "Admin",
          username: "admin",
        },
        {
          id: "bounty-1",
          title: "Test Bounty",
          deadline: new Date("2024-01-01T00:00:00.000Z"),
          submissionCount: 5,
          totalPrize: "1000",
          token: "DOT",
        }
      );
      expect(sendBountyWinnerReminderEmail).toHaveBeenCalledWith(
        {
          email: "owner@org.com",
          firstName: "Owner",
          username: "owner",
        },
        {
          id: "bounty-1",
          title: "Test Bounty",
          deadline: new Date("2024-01-01T00:00:00.000Z"),
          submissionCount: 5,
          totalPrize: "1000",
          token: "DOT",
        }
      );
    });

    test("should skip emails for bounties with no submissions", async () => {
      // Arrange
      const mockBounties = [mockExpiredBountyNoSubmissions];
      const mockUpdateResult = { count: 1 };

      vi.mocked(database.bounty.findMany).mockResolvedValue(
        mockBounties as any
      );
      vi.mocked(database.bounty.updateMany).mockResolvedValue(mockUpdateResult);
      vi.mocked(sendBountyWinnerReminderEmail).mockResolvedValue({} as any);

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.emailsSent).toBe(0);
      expect(sendBountyWinnerReminderEmail).not.toHaveBeenCalled();
    });

    test("should handle bounties with null amount", async () => {
      // Arrange
      const mockBountyWithNullAmount = {
        ...mockExpiredBounty,
        amount: null,
      };
      const mockBounties = [mockBountyWithNullAmount];
      const mockUpdateResult = { count: 1 };

      vi.mocked(database.bounty.findMany).mockResolvedValue(
        mockBounties as any
      );
      vi.mocked(database.bounty.updateMany).mockResolvedValue(mockUpdateResult);
      vi.mocked(sendBountyWinnerReminderEmail).mockResolvedValue({} as any);

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(sendBountyWinnerReminderEmail).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          totalPrize: "0",
        })
      );
    });

    test("should handle bounties with undefined amount", async () => {
      // Arrange
      const mockBountyWithUndefinedAmount = {
        ...mockExpiredBounty,
        amount: undefined,
      };
      const mockBounties = [mockBountyWithUndefinedAmount];
      const mockUpdateResult = { count: 1 };

      vi.mocked(database.bounty.findMany).mockResolvedValue(
        mockBounties as any
      );
      vi.mocked(database.bounty.updateMany).mockResolvedValue(mockUpdateResult);
      vi.mocked(sendBountyWinnerReminderEmail).mockResolvedValue({} as any);

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(sendBountyWinnerReminderEmail).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          totalPrize: "0",
        })
      );
    });

    test("should handle bounties with missing user fields", async () => {
      // Arrange
      const mockBountyWithMissingFields = {
        ...mockExpiredBounty,
        curators: [
          {
            user: {
              email: "admin@org.com",
              firstName: null,
              username: null,
            },
          },
        ],
      };
      const mockBounties = [mockBountyWithMissingFields];
      const mockUpdateResult = { count: 1 };

      vi.mocked(database.bounty.findMany).mockResolvedValue(
        mockBounties as any
      );
      vi.mocked(database.bounty.updateMany).mockResolvedValue(mockUpdateResult);
      vi.mocked(sendBountyWinnerReminderEmail).mockResolvedValue({} as any);

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(sendBountyWinnerReminderEmail).toHaveBeenCalledWith(
        {
          email: "admin@org.com",
          firstName: undefined,
          username: undefined,
        },
        expect.any(Object)
      );
    });

    test("should return success when no expired bounties found", async () => {
      // Arrange
      vi.mocked(database.bounty.findMany).mockResolvedValue([]);

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("No bounties found with expired deadlines");
      expect(data.updatedBounties).toEqual([]);
      expect(data.totalCount).toBe(0);
      expect(database.bounty.updateMany).not.toHaveBeenCalled();
      expect(sendBountyWinnerReminderEmail).not.toHaveBeenCalled();
    });

    test("should handle multiple expired bounties", async () => {
      // Arrange
      const mockBounties = [
        mockExpiredBounty,
        {
          ...mockExpiredBounty,
          id: "bounty-3",
          title: "Another Test Bounty",
          submissionCount: 3,
        },
      ];
      const mockUpdateResult = { count: 2 };

      vi.mocked(database.bounty.findMany).mockResolvedValue(
        mockBounties as any
      );
      vi.mocked(database.bounty.updateMany).mockResolvedValue(mockUpdateResult);
      vi.mocked(sendBountyWinnerReminderEmail).mockResolvedValue({} as any);

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.totalCount).toBe(2);
      expect(data.updatedBounties).toHaveLength(2);
      expect(data.emailsSent).toBe(2);

      expect(database.bounty.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ["bounty-1", "bounty-3"],
          },
        },
        data: {
          status: "REVIEWING",
          updatedAt: expect.any(Date),
        },
      });
    });

    test("should handle mixed bounties (with and without submissions)", async () => {
      // Arrange
      const mockBounties = [mockExpiredBounty, mockExpiredBountyNoSubmissions];
      const mockUpdateResult = { count: 2 };

      vi.mocked(database.bounty.findMany).mockResolvedValue(
        mockBounties as any
      );
      vi.mocked(database.bounty.updateMany).mockResolvedValue(mockUpdateResult);
      vi.mocked(sendBountyWinnerReminderEmail).mockResolvedValue({} as any);

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.totalCount).toBe(2);
      expect(data.emailsSent).toBe(1); // Only one bounty has submissions
      expect(sendBountyWinnerReminderEmail).toHaveBeenCalledTimes(2); // 2 curators for bounty with submissions
    });

    test("should handle email sending failures gracefully", async () => {
      // Arrange
      const mockBounties = [mockExpiredBounty];
      const mockUpdateResult = { count: 1 };

      vi.mocked(database.bounty.findMany).mockResolvedValue(
        mockBounties as any
      );
      vi.mocked(database.bounty.updateMany).mockResolvedValue(mockUpdateResult);
      vi.mocked(sendBountyWinnerReminderEmail)
        .mockRejectedValueOnce(new Error("Email service error"))
        .mockResolvedValueOnce({} as any);

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.totalCount).toBe(1);
      // Should still succeed even if some emails fail
    });

    test("should handle database findMany error", async () => {
      // Arrange
      vi.mocked(database.bounty.findMany).mockRejectedValue(
        new Error("Database connection error")
      );

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        "Failed to process bounty deadline pass cron job"
      );
      expect(data.details).toBe("Database connection error");
    });

    test("should handle database updateMany error", async () => {
      // Arrange
      const mockBounties = [mockExpiredBounty];

      vi.mocked(database.bounty.findMany).mockResolvedValue(
        mockBounties as any
      );
      vi.mocked(database.bounty.updateMany).mockRejectedValue(
        new Error("Update failed")
      );

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        "Failed to process bounty deadline pass cron job"
      );
      expect(data.details).toBe("Update failed");
    });

    test("should handle non-Error exceptions", async () => {
      // Arrange
      vi.mocked(database.bounty.findMany).mockRejectedValue("String error");

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe(
        "Failed to process bounty deadline pass cron job"
      );
      expect(data.details).toBe("Unknown error");
    });

    test("should update lastWinnerReminderSentAt for bounties with submissions", async () => {
      // Arrange
      const mockBounties = [mockExpiredBounty];
      const mockUpdateResult = { count: 1 };

      vi.mocked(database.bounty.findMany).mockResolvedValue(
        mockBounties as any
      );
      vi.mocked(database.bounty.updateMany)
        .mockResolvedValueOnce(mockUpdateResult) // First call for status update
        .mockResolvedValueOnce({ count: 1 }); // Second call for lastWinnerReminderSentAt
      vi.mocked(sendBountyWinnerReminderEmail).mockResolvedValue({} as any);

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(database.bounty.updateMany).toHaveBeenCalledTimes(2);

      // Verify second updateMany call for lastWinnerReminderSentAt
      expect(database.bounty.updateMany).toHaveBeenNthCalledWith(2, {
        where: {
          id: {
            in: ["bounty-1"],
          },
        },
        data: {
          lastWinnerReminderSentAt: expect.any(Date),
        },
      });
    });

    test("should not update lastWinnerReminderSentAt for bounties without submissions", async () => {
      // Arrange
      const mockBounties = [mockExpiredBountyNoSubmissions];
      const mockUpdateResult = { count: 1 };

      vi.mocked(database.bounty.findMany).mockResolvedValue(
        mockBounties as any
      );
      vi.mocked(database.bounty.updateMany).mockResolvedValue(mockUpdateResult);
      vi.mocked(sendBountyWinnerReminderEmail).mockResolvedValue({} as any);

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(database.bounty.updateMany).toHaveBeenCalledTimes(1); // Only status update
    });

    test("should handle bounties with no curators", async () => {
      // Arrange
      const mockBountyNoCurators = {
        ...mockExpiredBounty,
        curators: [],
      };
      const mockBounties = [mockBountyNoCurators];
      const mockUpdateResult = { count: 1 };

      vi.mocked(database.bounty.findMany).mockResolvedValue(
        mockBounties as any
      );
      vi.mocked(database.bounty.updateMany).mockResolvedValue(mockUpdateResult);
      vi.mocked(sendBountyWinnerReminderEmail).mockResolvedValue({} as any);

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.totalCount).toBe(1);
      expect(data.emailsSent).toBe(1); // Still counts as having submissions
      expect(sendBountyWinnerReminderEmail).not.toHaveBeenCalled(); // But no emails sent
    });

    test("should handle bounties with empty curators array", async () => {
      // Arrange
      const mockBountyEmptyCurators = {
        ...mockExpiredBounty,
        curators: [],
      };
      const mockBounties = [mockBountyEmptyCurators];
      const mockUpdateResult = { count: 1 };

      vi.mocked(database.bounty.findMany).mockResolvedValue(
        mockBounties as any
      );
      vi.mocked(database.bounty.updateMany).mockResolvedValue(mockUpdateResult);
      vi.mocked(sendBountyWinnerReminderEmail).mockResolvedValue({} as any);

      // Act
      const response = await bountyDeadlineCron();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.totalCount).toBe(1);
      expect(data.emailsSent).toBe(1); // Still counts as having submissions
      expect(sendBountyWinnerReminderEmail).not.toHaveBeenCalled(); // But no emails sent (no curators)
    });
  });
});
