import { database } from "@packages/db";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET as getBounty } from "../app/api/v1/bounties/[id]/route";
import { GET as getBounties } from "../app/api/v1/bounties/route";
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
      update: vi.fn(),
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
  });
});
