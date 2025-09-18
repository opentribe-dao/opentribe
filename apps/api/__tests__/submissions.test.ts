import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST as createSubmission } from "../app/api/v1/bounties/[id]/submissions/route";
import { POST as announceWinners } from "../app/api/v1/bounties/[id]/winners/route";

describe("Submission System Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/v1/bounties/[id]/submissions", () => {
    test("should create a submission for authenticated user", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "submitter@example.com",
          username: "submitter",
        },
      };

      const mockBounty = {
        id: "bounty-1",
        title: "Test Bounty",
        status: "OPEN",
        deadline: new Date("2025-12-31"),
        visibility: "PUBLISHED",
      };

      const mockSubmission = {
        id: "submission-1",
        bountyId: "bounty-1",
        submitterId: "user-123",
        title: "My Submission",
        description: "Submission description",
        submissionUrl: "https://github.com/user/repo",
        attachments: [],
        responses: {},
        isWinner: false,
        position: null,
        winningAmount: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);
      (database.submission.findFirst as any).mockResolvedValue(null);
      (database.submission.create as any).mockResolvedValue(mockSubmission);

      // Act
      const body = JSON.stringify({
        submissionUrl: "https://github.com/user/repo",
        title: "My Submission",
        description: "Submission description",
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createSubmission(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.submission.id).toBe("submission-1");
      expect(data.submission.title).toBe("My Submission");
      expect(database.submission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bountyId: "bounty-1",
            userId: "user-123",
            submissionUrl: "https://github.com/user/repo",
            title: "My Submission",
            description: "Submission description",
            status: "SUBMITTED",
          }),
          include: expect.any(Object),
        })
      );
    });

    test("should reject submission if user not authenticated", async () => {
      // Arrange
      (auth.api.getSession as any).mockResolvedValue(null);

      // Act
      const body = JSON.stringify({
        submissionUrl: "https://github.com/user/repo",
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createSubmission(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });

      // Assert
      expect(response.status).toBe(401);
      expect(database.submission.create).not.toHaveBeenCalled();
    });

    test("should reject submission for closed bounty", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "submitter@example.com",
        },
      };

      const mockBounty = {
        id: "bounty-1",
        status: "CLOSED",
        visibility: "PUBLIC",
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);

      // Act
      const body = JSON.stringify({
        submissionUrl: "https://github.com/user/repo",
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createSubmission(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });

      // Assert
      expect(response.status).toBe(400);
      expect(database.submission.create).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/bounties/[id]/winners", () => {
    test("should announce winners for organization owner", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "org-admin",
          email: "admin@org.com",
        },
      };

      const mockBounty = {
        id: "bounty-1",
        organizationId: "org-1",
        winnersAnnouncedAt: null,
        status: "OPEN",
        token: "USDT",
        winnings: { "1": 500, "2": 300, "3": 200 },
        organization: {
          id: "org-1",
          members: [
            {
              userId: "org-admin",
              role: "OWNER",
            },
          ],
        },
      };

      const mockUpdatedBounty = {
        ...mockBounty,
        winnersAnnouncedAt: new Date(),
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);
      (database.submission.findMany as any).mockResolvedValue([
        { id: "sub-1", userId: "u1", status: "SUBMITTED" },
        { id: "sub-2", userId: "u2", status: "SUBMITTED" },
        { id: "sub-3", userId: "u3", status: "SUBMITTED" },
      ]);
      // Simulate transaction outcome with winners and updated bounty
      (database.$transaction as any) = vi.fn(async (fn: any) => {
        return {
          ...mockUpdatedBounty,
          status: "COMPLETED",
          submissions: [
            {
              id: "sub-1",
              position: 1,
              winningAmount: 500,
              submitter: { email: "a@b.com", username: "u1" },
            },
            {
              id: "sub-2",
              position: 2,
              winningAmount: 300,
              submitter: { email: "c@d.com", username: "u2" },
            },
            {
              id: "sub-3",
              position: 3,
              winningAmount: 200,
              submitter: { email: "e@f.com", username: "u3" },
            },
          ],
          organization: { name: "Org" },
        };
      });

      // Act
      const body = JSON.stringify({
        winners: [
          { submissionId: "sub-1", position: 1, amount: 500 },
          { submissionId: "sub-2", position: 2, amount: 300 },
          { submissionId: "sub-3", position: 3, amount: 200 },
        ],
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/winners",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await announceWinners(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe("Winners announced successfully");
      // Assert
    });

    test("should prevent non-members from announcing winners", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "non-member",
          email: "user@example.com",
        },
      };

      const mockBounty = {
        id: "bounty-1",
        organizationId: "org-1",
        organization: {
          id: "org-1",
          members: [], // User not in members
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);

      // Act
      const body = JSON.stringify({
        winners: [{ submissionId: "sub-1", position: 1, amount: 500 }],
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/winners",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await announceWinners(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });

      // Assert
      expect(response.status).toBe(403);
      expect(database.submission.updateMany).not.toHaveBeenCalled();
      expect(database.bounty.update).not.toHaveBeenCalled();
    });
  });
});
