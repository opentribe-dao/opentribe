import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET as getBounty } from "../app/api/v1/bounties/[id]/route";
import { GET as getBounties } from "../app/api/v1/bounties/route";
import { PATCH as resetWinners } from "../app/api/v1/bounties/[id]/winners/reset/route";
import { NextRequest } from "next/server";

// Mock database
vi.mock("@packages/db", () => ({
  database: {
    bounty: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    submission: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock("@packages/auth/server", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

describe("Bounty Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/bounties", () => {
    test("should return list of public bounties", async () => {
      const mockBounties = [
        {
          id: "bounty-1",
          title: "Open Bounty",
          slug: "open-bounty",
          description: "Test",
          resources: null,
          screening: null,
          applicationUrl: null,
          skills: [],
          organizationId: "org-1",
          amount: 1000,
          amountUSD: 1000,
          token: "USD",
          winnings: {},
          split: "FIXED" as const,
          status: "OPEN" as const,
          visibility: "PUBLIC" as const,
          deadline: new Date(),
          publishedAt: new Date(),
          winnersAnnouncedAt: new Date(),
          viewCount: 0,
          submissionCount: 0,
          commentCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastReminderSentAt: null,
          lastWinnerReminderSentAt: null,
          organization: {
            id: "org-1",
            name: "Org",
            slug: "org",
            logo: null,
            location: null,
            industry: [],
          },
          _count: { submissions: 0 },
        },
        {
          id: "bounty-2",
          title: "Open Bounty 2",
          slug: "open-bounty-2",
          description: "Test",
          resources: null,
          screening: null,
          applicationUrl: null,
          skills: [],
          organizationId: "org-2",
          amount: 2000,
          amountUSD: 2000,
          token: "USD",
          winnings: {},
          split: "FIXED" as const,
          status: "OPEN" as const,
          visibility: "PUBLIC" as const,
          deadline: new Date(),
          publishedAt: new Date(),
          winnersAnnouncedAt: new Date(),
          viewCount: 0,
          submissionCount: 0,
          commentCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastReminderSentAt: null,
          lastWinnerReminderSentAt: null,
          organization: {
            id: "org-2",
            name: "Org",
            slug: "org",
            logo: null,
            location: null,
            industry: [],
          },
          _count: { submissions: 0 },
        },
      ];

      vi.mocked(database.bounty.findMany).mockResolvedValue(
        mockBounties as any
      );
      vi.mocked(database.bounty.count).mockResolvedValue(2);

      const request = new NextRequest("http://localhost:3002/api/v1/bounties");
      const response = await getBounties(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bounties).toHaveLength(2);
      expect(data.bounties[0].title).toBe("Open Bounty");
    });

    test("should filter bounties by status", async () => {
      const mockBounties = [
        {
          id: "bounty-1",
          title: "Open Bounty",
          slug: "open-bounty",
          description: "Test",
          resources: null,
          screening: null,
          applicationUrl: null,
          skills: [],
          organizationId: "org-1",
          amount: 1000,
          amountUSD: 1000,
          token: "USD",
          winnings: {},
          split: "FIXED" as const,
          status: "OPEN" as const,
          visibility: "PUBLIC" as const,
          deadline: new Date(),
          publishedAt: new Date(),
          winnersAnnouncedAt: new Date(),
          viewCount: 0,
          submissionCount: 0,
          commentCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastReminderSentAt: null,
          lastWinnerReminderSentAt: null,
          organization: { id: "org-1", name: "Org", slug: "org" },
          _count: { submissions: 0 },
        },
      ];

      vi.mocked(database.bounty.findMany).mockResolvedValue(
        mockBounties as any
      );
      vi.mocked(database.bounty.count).mockResolvedValue(1);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties?status=OPEN"
      );
      const response = await getBounties(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bounties).toHaveLength(1);
      expect(data.bounties[0].status).toBe("OPEN");
    });
  });

  describe("GET /api/v1/bounties/[id]", () => {
    test("should return bounty details with submissions", async () => {
      const mockBounty = {
        id: "bounty-1",
        title: "Test Bounty",
        slug: "test-bounty",
        description: "Detailed description",
        resources: null,
        screening: null,
        applicationUrl: null,
        skills: [],
        organizationId: "org-1",
        amount: 1000,
        amountUSD: 1000,
        token: "USD",
        winnings: { "1": 500, "2": 300, "3": 200 },
        split: "FIXED" as const,
        status: "OPEN" as const,
        visibility: "PUBLIC" as const,
        deadline: new Date("2025-12-31"),
        publishedAt: new Date(),
        winnersAnnouncedAt: new Date(),
        viewCount: 0,
        submissionCount: 0,
        commentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastReminderSentAt: null,
        lastWinnerReminderSentAt: null,
        organization: {
          id: "org-1",
          name: "Test Organization",
          slug: "test-org",
          logo: null,
        },
        submissions: [
          {
            id: "sub-1",
            title: "Submission 1",
            isWinner: false,
            position: null,
            winningAmount: null,
            submitter: {
              id: "user-1",
              username: "user1",
              firstName: "John",
              lastName: "Doe",
            },
          },
        ],
        _count: {
          submissions: 1,
        },
      };

      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1"
      );
      const response = await getBounty(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bounty.id).toBe("bounty-1");
      expect(data.bounty.title).toBe("Test Bounty");
      expect(data.bounty.submissions).toHaveLength(1);
    });

    test("should return 404 for non-existent bounty", async () => {
      vi.mocked(database.bounty.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/invalid-id"
      );
      const response = await getBounty(request, {
        params: Promise.resolve({ id: "invalid-id" }),
      });

      expect(response.status).toBe(404);
    });

    test("should set canSubmit=false for organization members", async () => {
      const mockBounty = {
        id: "bounty-1",
        title: "Test Bounty",
        slug: "test-bounty",
        description: "Test",
        organizationId: "org-1",
        amount: 1000,
        token: "USD",
        status: "OPEN",
        visibility: "PUBLIC",
        winnersAnnouncedAt: new Date(),
        submissions: [],
        _count: { submissions: 0, comments: 0 },
        organization: {
          id: "org-1",
          name: "Test Org",
          slug: "test-org",
          logo: null,
        },
      };

      const mockSession = {
        user: { id: "user-1", email: "user@example.com" },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);
      vi.mocked(database.bounty.update).mockResolvedValue(mockBounty as any);
      vi.mocked(database.member.count).mockResolvedValue(1); // User is a member
      vi.mocked(database.submission.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1"
      );
      const response = await getBounty(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bounty.canSubmit).toBe(false);
      expect(data.bounty.userSubmissionId).toBe(null);
      expect(database.member.count).toHaveBeenCalledWith({
        where: {
          organizationId: "org-1",
          userId: "user-1",
        },
      });
    });

    test("should set canSubmit=true for non-members without existing submission", async () => {
      const mockBounty = {
        id: "bounty-1",
        title: "Test Bounty",
        slug: "test-bounty",
        description: "Test",
        organizationId: "org-1",
        amount: 1000,
        token: "USD",
        status: "OPEN",
        visibility: "PUBLIC",
        winnersAnnouncedAt: new Date(),
        submissions: [],
        _count: { submissions: 0, comments: 0 },
        organization: {
          id: "org-1",
          name: "Test Org",
          slug: "test-org",
          logo: null,
        },
      };

      const mockSession = {
        user: { id: "user-1", email: "user@example.com" },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);
      vi.mocked(database.bounty.update).mockResolvedValue(mockBounty as any);
      vi.mocked(database.member.count).mockResolvedValue(0); // User is NOT a member
      vi.mocked(database.submission.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1"
      );
      const response = await getBounty(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bounty.canSubmit).toBe(true);
      expect(data.bounty.userSubmissionId).toBe(null);
    });

    test("should set canSubmit=false when user already submitted", async () => {
      const mockBounty = {
        id: "bounty-1",
        title: "Test Bounty",
        slug: "test-bounty",
        description: "Test",
        organizationId: "org-1",
        amount: 1000,
        token: "USD",
        status: "OPEN",
        visibility: "PUBLIC",
        winnersAnnouncedAt: new Date(),
        submissions: [],
        _count: { submissions: 0, comments: 0 },
        organization: {
          id: "org-1",
          name: "Test Org",
          slug: "test-org",
          logo: null,
        },
      };

      const mockSession = {
        user: { id: "user-1", email: "user@example.com" },
      };

      const mockSubmission = {
        id: "submission-1",
        bountyId: "bounty-1",
        userId: "user-1",
        title: "My Submission",
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);
      vi.mocked(database.bounty.update).mockResolvedValue(mockBounty as any);
      vi.mocked(database.member.count).mockResolvedValue(0);
      vi.mocked(database.submission.findFirst).mockResolvedValue(
        mockSubmission as any
      );

      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1"
      );
      const response = await getBounty(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bounty.canSubmit).toBe(false);
      expect(data.bounty.userSubmissionId).toBe("submission-1");
      expect(database.submission.findFirst).toHaveBeenCalledWith({
        where: {
          bountyId: "bounty-1",
          userId: "user-1",
        },
      });
    });

    test("should set canSubmit=true for unauthenticated users", async () => {
      const mockBounty = {
        id: "bounty-1",
        title: "Test Bounty",
        slug: "test-bounty",
        description: "Test",
        organizationId: "org-1",
        amount: 1000,
        token: "USD",
        status: "OPEN",
        visibility: "PUBLIC",
        winnersAnnouncedAt: new Date(),
        submissions: [],
        _count: { submissions: 0, comments: 0 },
        organization: {
          id: "org-1",
          name: "Test Org",
          slug: "test-org",
          logo: null,
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(null); // No session
      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);
      vi.mocked(database.bounty.update).mockResolvedValue(mockBounty as any);
      vi.mocked(database.member.count).mockResolvedValue(0);
      vi.mocked(database.submission.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1"
      );
      const response = await getBounty(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bounty.canSubmit).toBe(true);
      expect(data.bounty.userSubmissionId).toBe(null);
    });
  });

  describe("PATCH /api/v1/bounties/[id]/winners/reset", () => {
    test("should successfully reset approved submissions for organization admin", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "admin-1",
          email: "admin@org.com",
        },
      };

      const mockBounty = {
        id: "bounty-1",
        title: "Test Bounty",
        organizationId: "org-1",
      };

      const mockApprovedSubmissions = [
        {
          id: "submission-1",
          title: "Winner 1",
          position: 1,
          winningAmount: 500,
          reviewedAt: new Date(),
          submitter: {
            id: "user-1",
            username: "winner1",
            email: "winner1@example.com",
          },
        },
        {
          id: "submission-2",
          title: "Winner 2",
          position: 2,
          winningAmount: 300,
          reviewedAt: new Date(),
          submitter: {
            id: "user-2",
            username: "winner2",
            email: "winner2@example.com",
          },
        },
      ];

      const mockResetResult = { count: 2 };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);
      (database.member.findFirst as any).mockResolvedValue({
        organizationId: "org-1",
        userId: "admin-1",
        role: "admin",
      });
      (database.submission.findMany as any).mockResolvedValue(
        mockApprovedSubmissions
      );
      (database.submission.updateMany as any).mockResolvedValue(
        mockResetResult
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/winners/reset",
        {
          method: "PATCH",
        }
      );

      const response = await resetWinners(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe(
        "Successfully reset 2 approved submissions to submitted status"
      );
      expect(data.resetCount).toBe(2);
      expect(data.affectedSubmissions).toHaveLength(2);
      expect(data.affectedSubmissions[0].id).toBe("submission-1");
      expect(data.affectedSubmissions[1].id).toBe("submission-2");

      // Verify database calls
      expect(database.bounty.findUnique).toHaveBeenCalledWith({
        where: { id: "bounty-1" },
      });
      expect(database.member.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: "org-1",
          userId: "admin-1",
          role: { in: ["owner", "admin"] },
        },
      });
      expect(database.submission.findMany).toHaveBeenCalledWith({
        where: {
          bountyId: "bounty-1",
          status: "APPROVED",
        },
        select: {
          id: true,
          title: true,
          position: true,
          winningAmount: true,
          reviewedAt: true,
          submitter: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });
      expect(database.submission.updateMany).toHaveBeenCalledWith({
        where: {
          bountyId: "bounty-1",
          status: "APPROVED",
        },
        data: {
          status: "SUBMITTED",
          reviewedAt: expect.any(Date),
          position: null,
          winningAmount: null,
          isWinner: false,
        },
      });
    });

    test("should successfully reset approved submissions for organization owner", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "owner-1",
          email: "owner@org.com",
        },
      };

      const mockBounty = {
        id: "bounty-1",
        title: "Test Bounty",
        organizationId: "org-1",
      };

      const mockApprovedSubmissions = [
        {
          id: "submission-1",
          title: "Winner 1",
          position: 1,
          winningAmount: 500,
          reviewedAt: new Date(),
          submitter: {
            id: "user-1",
            username: "winner1",
            email: "winner1@example.com",
          },
        },
      ];

      const mockResetResult = { count: 1 };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);
      (database.member.findFirst as any).mockResolvedValue({
        organizationId: "org-1",
        userId: "owner-1",
        role: "owner",
      });
      (database.submission.findMany as any).mockResolvedValue(
        mockApprovedSubmissions
      );
      (database.submission.updateMany as any).mockResolvedValue(
        mockResetResult
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/winners/reset",
        {
          method: "PATCH",
        }
      );

      const response = await resetWinners(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.resetCount).toBe(1);
      expect(database.member.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: "org-1",
          userId: "owner-1",
          role: { in: ["owner", "admin"] },
        },
      });
    });

    test("should return message when no approved submissions found", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "admin-1",
          email: "admin@org.com",
        },
      };

      const mockBounty = {
        id: "bounty-1",
        title: "Test Bounty",
        organizationId: "org-1",
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);
      (database.member.findFirst as any).mockResolvedValue({
        organizationId: "org-1",
        userId: "admin-1",
        role: "admin",
      });
      (database.submission.findMany as any).mockResolvedValue([]); // No approved submissions

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/winners/reset",
        {
          method: "PATCH",
        }
      );

      const response = await resetWinners(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe("No approved submissions found to reset");
      expect(data.resetCount).toBe(0);
      expect(database.submission.updateMany).not.toHaveBeenCalled();
    });

    test("should return 401 for unauthenticated users", async () => {
      // Arrange
      (auth.api.getSession as any).mockResolvedValue(null);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/winners/reset",
        {
          method: "PATCH",
        }
      );

      const response = await resetWinners(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });

      // Assert
      expect(response.status).toBe(401);
      expect(database.bounty.findUnique).not.toHaveBeenCalled();
    });

    test("should return 404 for non-existent bounty", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "admin-1",
          email: "admin@org.com",
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(null);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/non-existent/winners/reset",
        {
          method: "PATCH",
        }
      );

      const response = await resetWinners(request, {
        params: Promise.resolve({ id: "non-existent" }),
      });

      // Assert
      expect(response.status).toBe(404);
      expect(database.member.findFirst).not.toHaveBeenCalled();
    });

    test("should return 403 for non-members", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "non-member-1",
          email: "nonmember@example.com",
        },
      };

      const mockBounty = {
        id: "bounty-1",
        title: "Test Bounty",
        organizationId: "org-1",
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);
      (database.member.findFirst as any).mockResolvedValue(null); // Not a member

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/winners/reset",
        {
          method: "PATCH",
        }
      );

      const response = await resetWinners(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });

      // Assert
      expect(response.status).toBe(403);
      expect(database.submission.findMany).not.toHaveBeenCalled();
    });

    test("should return 403 for members without admin/owner role", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "member-1",
          email: "member@org.com",
        },
      };

      const mockBounty = {
        id: "bounty-1",
        title: "Test Bounty",
        organizationId: "org-1",
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);
      (database.member.findFirst as any).mockResolvedValue(null);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/winners/reset",
        {
          method: "PATCH",
        }
      );

      const response = await resetWinners(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });

      // Assert
      expect(response.status).toBe(403);
      expect(database.submission.findMany).not.toHaveBeenCalled();
    });

    test("should handle database errors gracefully", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "admin-1",
          email: "admin@org.com",
        },
      };

      const mockBounty = {
        id: "bounty-1",
        title: "Test Bounty",
        organizationId: "org-1",
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);
      (database.member.findFirst as any).mockResolvedValue({
        organizationId: "org-1",
        userId: "admin-1",
        role: "admin",
      });
      (database.submission.findMany as any).mockRejectedValue(
        new Error("Database error")
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/winners/reset",
        {
          method: "PATCH",
        }
      );

      const response = await resetWinners(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });

      // Assert
      expect(response.status).toBe(500);
      expect(response.json()).resolves.toEqual({
        error: "Failed to reset approved submissions",
      });
    });

    test("should handle updateMany errors gracefully", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "admin-1",
          email: "admin@org.com",
        },
      };

      const mockBounty = {
        id: "bounty-1",
        title: "Test Bounty",
        organizationId: "org-1",
      };

      const mockApprovedSubmissions = [
        {
          id: "submission-1",
          title: "Winner 1",
          position: 1,
          winningAmount: 500,
          reviewedAt: new Date(),
          submitter: {
            id: "user-1",
            username: "winner1",
            email: "winner1@example.com",
          },
        },
      ];

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);
      (database.member.findFirst as any).mockResolvedValue({
        organizationId: "org-1",
        userId: "admin-1",
        role: "admin",
      });
      (database.submission.findMany as any).mockResolvedValue(
        mockApprovedSubmissions
      );
      (database.submission.updateMany as any).mockRejectedValue(
        new Error("Update failed")
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/winners/reset",
        {
          method: "PATCH",
        }
      );

      const response = await resetWinners(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });

      // Assert
      expect(response.status).toBe(500);
      expect(response.json()).resolves.toEqual({
        error: "Failed to reset approved submissions",
      });
    });

    test("should handle empty approved submissions array", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "admin-1",
          email: "admin@org.com",
        },
      };

      const mockBounty = {
        id: "bounty-1",
        title: "Test Bounty",
        organizationId: "org-1",
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);
      (database.member.findFirst as any).mockResolvedValue({
        organizationId: "org-1",
        userId: "admin-1",
        role: "admin",
      });
      (database.submission.findMany as any).mockResolvedValue([]);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/winners/reset",
        {
          method: "PATCH",
        }
      );

      const response = await resetWinners(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe("No approved submissions found to reset");
      expect(data.resetCount).toBe(0);
      expect(data.affectedSubmissions).toBeUndefined();
      expect(database.submission.updateMany).not.toHaveBeenCalled();
    });

    test("should handle general errors in try-catch block", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "admin-1",
          email: "admin@org.com",
        },
      };

      // Mock an error that would be caught by the general catch block
      (auth.api.getSession as any).mockRejectedValue(
        new Error("Unexpected error")
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/winners/reset",
        {
          method: "PATCH",
        }
      );

      const response = await resetWinners(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });

      // Assert
      expect(response.status).toBe(500);
      expect(response.json()).resolves.toEqual({
        error: "Failed to reset approved submissions",
      });
    });
  });
});
