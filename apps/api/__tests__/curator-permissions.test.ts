import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { exchangeRateService } from "@packages/polkadot/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST as announceWinners } from "../app/api/v1/bounties/[id]/winners/route";
import { PATCH as assignPosition } from "../app/api/v1/bounties/[id]/submissions/[submissionId]/position/route";
import { PATCH as reviewSubmission } from "../app/api/v1/bounties/[id]/submissions/[submissionId]/review/route";
import { PATCH as resetWinners } from "../app/api/v1/bounties/[id]/winners/reset/route";
import { POST as recordPayment } from "../app/api/v1/bounties/[id]/payments/route";
import { POST as createBounty } from "../app/api/v1/organizations/[organizationId]/bounties/route";
import {
  PATCH as updateBounty,
  DELETE as deleteBounty,
} from "../app/api/v1/organizations/[organizationId]/bounties/[id]/route";
import { getOrganizationAuth, hasRequiredRole } from "../lib/organization-auth";

// Mock database
vi.mock("@packages/db", () => ({
  database: {
    bounty: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    submission: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    curator: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    payment: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock auth
vi.mock("@packages/auth/server", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock organization-auth
vi.mock("../lib/organization-auth", () => ({
  getOrganizationAuth: vi.fn(),
  hasRequiredRole: vi.fn((membership, roles) =>
    roles.includes(membership.role)
  ),
}));

// Mock exchange rate service
vi.mock("@packages/polkadot/server", () => ({
  exchangeRateService: {
    getExchangeRates: vi.fn(),
  },
}));

// Mock email
vi.mock("@packages/email", () => ({
  sendBountyWinnerEmail: vi.fn(),
  sendPaymentConfirmationEmail: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

describe("Curator Permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCuratorSession = {
    user: {
      id: "curator-user",
      email: "curator@example.com",
    },
  };

  const mockCuratorMembership = {
    id: "member-1",
    userId: "curator-user",
    organizationId: "org-1",
    role: "member", // Curator is not owner/admin
  };

  const mockCurator = {
    id: "curator-1",
    userId: "curator-user",
    bountyId: "bounty-1",
    contact: "curator@example.com",
    createdAt: new Date(),
  };

  // ==========================================================================
  // Curator CAN Announce Winners
  // ==========================================================================
  describe("POST /api/v1/bounties/[id]/winners - Curator Permissions", () => {
    test("should allow curator to announce winners", async () => {
      // Arrange
      const mockBounty = {
        id: "bounty-1",
        organizationId: "org-1",
        status: "OPEN",
        token: "USDT",
        winnings: { "1": 500, "2": 300 },
      };

      const mockSubmissions = [
        { id: "sub-1", userId: "u1", status: "SUBMITTED" },
        { id: "sub-2", userId: "u2", status: "SUBMITTED" },
      ];

      (auth.api.getSession as any).mockResolvedValue(mockCuratorSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);
      (getOrganizationAuth as any).mockResolvedValue({
        userId: "curator-user",
        membership: mockCuratorMembership,
      });
      (hasRequiredRole as any).mockReturnValue(false); // Not owner/admin
      (database.curator.findFirst as any).mockResolvedValue(mockCurator);
      (database.submission.findMany as any).mockResolvedValue(mockSubmissions);
      (exchangeRateService.getExchangeRates as any).mockResolvedValue({
        USDT: 1.0,
      });

      (database.$transaction as any) = vi.fn(async (fn: any) => {
        const tx = {
          submission: {
            updateMany: vi.fn(),
            update: vi.fn(),
          },
          bounty: {
            update: vi.fn().mockResolvedValue({
              ...mockBounty,
              status: "COMPLETED",
              winnersAnnouncedAt: new Date(),
              submissions: [
                {
                  id: "sub-1",
                  position: 1,
                  winningAmount: 500,
                  submitter: { email: "a@b.com", username: "u1" },
                },
              ],
              organization: { name: "Org" },
            }),
          },
        };
        return await fn(tx);
      });

      // Act
      const body = JSON.stringify({
        winners: [
          { submissionId: "sub-1", position: 1, amount: 500 },
          { submissionId: "sub-2", position: 2, amount: 300 },
        ],
      });

      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/winners",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }
      );

      const response = await announceWinners(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });

      // Assert
      expect(response.status).toBe(200);
      expect(database.curator.findFirst).toHaveBeenCalledWith({
        where: {
          userId: "curator-user",
          bountyId: "bounty-1",
        },
      });
    });

    test("should reject member (not curator) from announcing winners", async () => {
      // Arrange
      const mockBounty = {
        id: "bounty-1",
        organizationId: "org-1",
      };

      (auth.api.getSession as any).mockResolvedValue(mockCuratorSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);
      (getOrganizationAuth as any).mockResolvedValue({
        userId: "curator-user",
        membership: mockCuratorMembership,
      });
      (hasRequiredRole as any).mockReturnValue(false);
      (database.curator.findFirst as any).mockResolvedValue(null); // Not a curator

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/winners",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ winners: [] }),
        }
      );

      const response = await announceWinners(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toContain("permission to announce winners");
    });
  });

  // ==========================================================================
  // Curator CAN Assign Positions
  // ==========================================================================
  describe("PATCH /api/v1/bounties/[id]/submissions/[submissionId]/position - Curator Permissions", () => {
    test("should allow curator to assign positions", async () => {
      // Arrange
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

      const mockUpdatedSubmission = {
        ...mockSubmission,
        position: 1,
        winningAmount: 1000,
        winningAmountUSD: 7000,
        isWinner: true,
        submitter: {
          id: "submitter-123",
          username: "submitter",
          email: "submitter@example.com",
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockCuratorSession);
      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);
      (getOrganizationAuth as any).mockResolvedValue({
        userId: "curator-user",
        membership: mockCuratorMembership,
      });
      (hasRequiredRole as any).mockReturnValue(false);
      (database.curator.findFirst as any).mockResolvedValue(mockCurator);
      (exchangeRateService.getExchangeRates as any).mockResolvedValue({
        DOT: 7.0,
      });

      (database.$transaction as any) = vi.fn(async (fn: any) => {
        const tx = {
          submission: {
            findFirst: vi.fn().mockResolvedValue(null),
            update: vi.fn().mockResolvedValue(mockUpdatedSubmission),
          },
        };
        return await fn(tx);
      });

      // Act
      const body = JSON.stringify({ position: 1 });
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions/submission-1/position",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body,
        }
      );

      const response = await assignPosition(request, {
        params: Promise.resolve({
          id: "bounty-1",
          submissionId: "submission-1",
        }),
      });

      // Assert
      expect(response.status).toBe(200);
      expect(database.curator.findFirst).toHaveBeenCalledWith({
        where: {
          userId: "curator-user",
          bountyId: "bounty-1",
        },
      });
    });
  });

  // ==========================================================================
  // Curator CAN Mark/Unmark SPAM
  // ==========================================================================
  describe("PATCH /api/v1/bounties/[id]/submissions/[submissionId]/review - Curator Permissions", () => {
    test("should allow curator to mark submission as SPAM", async () => {
      // Arrange
      const mockSubmission = {
        id: "submission-1",
        bountyId: "bounty-1",
        status: "SUBMITTED",
        position: null,
        bounty: {
          id: "bounty-1",
          organizationId: "org-1",
        },
      };

      const mockUpdatedSubmission = {
        ...mockSubmission,
        status: "SPAM",
        reviewedAt: new Date(),
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

      (auth.api.getSession as any).mockResolvedValue(mockCuratorSession);
      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);
      (getOrganizationAuth as any).mockResolvedValue({
        userId: "curator-user",
        membership: mockCuratorMembership,
      });
      (hasRequiredRole as any).mockReturnValue(false);
      (database.curator.findFirst as any).mockResolvedValue(mockCurator);
      (database.submission.update as any).mockResolvedValue(
        mockUpdatedSubmission
      );

      // Act
      const body = JSON.stringify({ status: "SPAM" });
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions/submission-1/review",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body,
        }
      );

      const response = await reviewSubmission(request, {
        params: Promise.resolve({
          id: "bounty-1",
          submissionId: "submission-1",
        }),
      });

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.submission.status).toBe("SPAM");
    });

    test("should allow curator to unmark SPAM submission", async () => {
      // Arrange
      const mockSubmission = {
        id: "submission-1",
        bountyId: "bounty-1",
        status: "SPAM",
        position: null,
        bounty: {
          id: "bounty-1",
          organizationId: "org-1",
        },
      };

      const mockUpdatedSubmission = {
        ...mockSubmission,
        status: "SUBMITTED",
        reviewedAt: new Date(),
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

      (auth.api.getSession as any).mockResolvedValue(mockCuratorSession);
      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);
      (getOrganizationAuth as any).mockResolvedValue({
        userId: "curator-user",
        membership: mockCuratorMembership,
      });
      (hasRequiredRole as any).mockReturnValue(false);
      (database.curator.findFirst as any).mockResolvedValue(mockCurator);
      (database.submission.update as any).mockResolvedValue(
        mockUpdatedSubmission
      );

      // Act
      const body = JSON.stringify({
        status: "SUBMITTED",
        action: "CLEAR_SPAM",
      });
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions/submission-1/review",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body,
        }
      );

      const response = await reviewSubmission(request, {
        params: Promise.resolve({
          id: "bounty-1",
          submissionId: "submission-1",
        }),
      });

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.submission.status).toBe("SUBMITTED");
    });
  });

  // ==========================================================================
  // Curator CAN Reset Winners
  // ==========================================================================
  describe("PATCH /api/v1/bounties/[id]/winners/reset - Curator Permissions", () => {
    test("should allow curator to reset winners", async () => {
      // Arrange
      const mockBounty = {
        id: "bounty-1",
        organizationId: "org-1",
      };

      const mockWinnerSubmissions = [
        {
          id: "sub-1",
          title: "Winner 1",
          position: 1,
          winningAmount: 500,
          submitter: {
            id: "u1",
            username: "user1",
            email: "u1@example.com",
          },
        },
      ];

      (auth.api.getSession as any).mockResolvedValue(mockCuratorSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);
      (getOrganizationAuth as any).mockResolvedValue({
        userId: "curator-user",
        membership: mockCuratorMembership,
      });
      (hasRequiredRole as any).mockReturnValue(false);
      (database.curator.findFirst as any).mockResolvedValue(mockCurator);
      (database.submission.findMany as any).mockResolvedValue(
        mockWinnerSubmissions
      );
      (database.submission.updateMany as any).mockResolvedValue({ count: 1 });

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
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.resetCount).toBe(1);
    });
  });

  // ==========================================================================
  // Curator CAN Record Payments
  // ==========================================================================
  describe("POST /api/v1/bounties/[id]/payments - Curator Permissions", () => {
    test("should allow curator to record payments", async () => {
      // Arrange
      const mockSubmission = {
        id: "submission-1",
        bountyId: "bounty-1",
        isWinner: true,
        bounty: {
          id: "bounty-1",
          organizationId: "org-1",
        },
        submitter: {
          id: "submitter-123",
          email: "submitter@example.com",
        },
      };

      const mockPayment = {
        id: "payment-1",
        submissionId: "submission-1",
        amount: 500,
        token: "USDT",
        status: "PENDING",
      };

      (auth.api.getSession as any).mockResolvedValue(mockCuratorSession);
      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);
      (getOrganizationAuth as any).mockResolvedValue({
        userId: "curator-user",
        membership: mockCuratorMembership,
      });
      (hasRequiredRole as any).mockReturnValue(false);
      (database.curator.findFirst as any).mockResolvedValue(mockCurator);
      (database.payment.findFirst as any).mockResolvedValue(null);
      (database.payment.create as any).mockResolvedValue(mockPayment);

      // Act
      const body = JSON.stringify({
        submissionId: "submission-1",
        extrinsicHash: "0x123",
        amount: 500,
        token: "USDT",
      });

      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/payments",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }
      );

      const response = await recordPayment(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });

      // Assert
      expect(response.status).toBe(200);
      expect(database.curator.findFirst).toHaveBeenCalledWith({
        where: {
          userId: "curator-user",
          bountyId: "bounty-1",
        },
      });
    });
  });

  // ==========================================================================
  // Curator CAN Update Bounties (Including Financial Fields When CLOSED)
  // ==========================================================================
  describe("PATCH /api/v1/organizations/[organizationId]/bounties/[id] - Curator Permissions", () => {
    test("should allow curator to update financial fields of CLOSED bounty", async () => {
      // Arrange
      const mockBounty = {
        id: "bounty-1",
        organizationId: "org-1",
        status: "CLOSED",
        title: "Test Bounty",
      };

      const mockUpdatedBounty = {
        ...mockBounty,
        amount: 2000,
        token: "DOT",
        winnings: { "1": 1500, "2": 500 },
      };

      (getOrganizationAuth as any).mockResolvedValue({
        userId: "curator-user",
        membership: mockCuratorMembership,
      });
      (hasRequiredRole as any).mockReturnValue(false);
      (database.curator.findFirst as any).mockResolvedValue(mockCurator);
      (database.bounty.findFirst as any).mockResolvedValue(mockBounty);
      (database.bounty.update as any).mockResolvedValue({
        ...mockUpdatedBounty,
        organization: { id: "org-1", name: "Org", logo: null },
        _count: { submissions: 0, comments: 0 },
      });

      // Act
      const body = JSON.stringify({
        amount: 2000,
        token: "DOT",
        winnings: { "1": 1500, "2": 500 },
      });

      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body,
        }
      );

      const response = await updateBounty(request, {
        params: Promise.resolve({ organizationId: "org-1", id: "bounty-1" }),
      });

      // Assert
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      // Verify that curator check was called
      expect(database.curator.findFirst).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Curator CANNOT Delete Bounties
  // ==========================================================================
  describe("DELETE /api/v1/organizations/[organizationId]/bounties/[id] - Curator Restrictions", () => {
    test("should reject curator from deleting bounties", async () => {
      // Arrange
      const mockBounty = {
        id: "bounty-1",
        organizationId: "org-1",
        _count: {
          submissions: 0,
        },
      };

      (getOrganizationAuth as any).mockResolvedValue({
        userId: "curator-user",
        membership: mockCuratorMembership,
      });
      (hasRequiredRole as any).mockReturnValue(false); // Not owner/admin
      (database.bounty.findFirst as any).mockResolvedValue(mockBounty);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1",
        {
          method: "DELETE",
        }
      );

      const response = await deleteBounty(request, {
        params: Promise.resolve({ organizationId: "org-1", id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toContain("permission to delete");
      // Verify curator check is NOT performed (deletion is owner/admin only)
      expect(database.curator.findFirst).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Curator CANNOT Create Bounties
  // ==========================================================================
  describe("POST /api/v1/organizations/[organizationId]/bounties - Curator Restrictions", () => {
    test("should reject curator from creating bounties", async () => {
      // Arrange
      (getOrganizationAuth as any).mockResolvedValue({
        userId: "curator-user",
        membership: mockCuratorMembership,
      });
      (hasRequiredRole as any).mockReturnValue(false); // Not owner/admin
      (database.bounty.findUnique as any).mockResolvedValue(null);

      // Act
      const body = JSON.stringify({
        title: "New Bounty",
        description: "Test",
        skills: [],
        amount: 1000,
        token: "DOT",
        split: "FIXED",
        deadline: new Date().toISOString(),
        visibility: "DRAFT",
      });

      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }
      );

      const response = await createBounty(request, {
        params: Promise.resolve({ organizationId: "org-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toContain("permission to create bounties");
      // Verify curator check is NOT performed (creation is owner/admin only)
      expect(database.curator.findFirst).not.toHaveBeenCalled();
    });
  });
});
