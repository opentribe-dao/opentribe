import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST as createRFP } from "../app/api/v1/organizations/[organizationId]/rfps/route";
import { GET as getRFP } from "../app/api/v1/rfps/[id]/route";
import { GET as getRFPs } from "../app/api/v1/rfps/route";
import { NextRequest } from "next/server";

// Mock database (align with route usage: rFP, member, grant)
vi.mock("@packages/db", () => ({
  database: {
    rFP: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
    },
    grant: {
      findFirst: vi.fn(),
      update: vi.fn(),
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

describe("RFP Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/rfps", () => {
    test("should return list of public RFPs", async () => {
      const mockRFPs = [
        {
          id: "rfp-1",
          title: "Test RFP 1",
          slug: "test-rfp-1",
          description: "RFP Description",
          status: "OPEN",
          visibility: "PUBLISHED",
          grant: {
            id: "grant-1",
            title: "Test Grant",
            slug: "test-grant",
            organization: {
              id: "org-1",
              name: "Test Org",
              slug: "test-org",
            },
          },
          _count: {
            votes: 10,
            comments: 5,
            applications: 3,
          },
        },
      ];

      vi.mocked(database.rFP.findMany).mockResolvedValue(mockRFPs as any);

      const request = new NextRequest("http://localhost:3002/api/v1/rfps");
      const response = await getRFPs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rfps).toHaveLength(1);
      expect(data.rfps[0].title).toBe("Test RFP 1");
      expect(data.rfps[0]._count.votes).toBe(10);
    });

    test("should filter RFPs by status", async () => {
      const mockRFPs = [
        {
          id: "rfp-1",
          title: "Open RFP",
          status: "OPEN",
          visibility: "PUBLISHED",
          grant: {
            id: "grant-1",
            title: "Grant",
            organization: { id: "org-1", name: "Org", slug: "org" },
          },
          _count: { votes: 0, comments: 0, applications: 0 },
        },
      ];

      vi.mocked(database.rFP.findMany).mockResolvedValue(mockRFPs as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps?status=OPEN"
      );
      const response = await getRFPs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rfps[0].status).toBe("OPEN");
    });

    test("should handle new sorting options", async () => {
      const mockRFPs = [
        {
          id: "rfp-1",
          title: "Popular RFP",
          status: "OPEN",
          visibility: "PUBLISHED",
          voteCount: 100,
          grant: {
            id: "grant-1",
            title: "Grant",
            organization: { id: "org-1", name: "Org", slug: "org" },
          },
          _count: { votes: 100, comments: 0, applications: 0 },
        },
      ];

      vi.mocked(database.rFP.findMany).mockResolvedValue(mockRFPs as any);

      // Test popular sorting
      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps?sort=popular"
      );
      const response = await getRFPs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.sort).toBe("popular");
    });

    test("should handle most_applications sorting", async () => {
      const mockRFPs = [
        {
          id: "rfp-1",
          title: "High Application RFP",
          status: "OPEN",
          visibility: "PUBLISHED",
          grant: {
            id: "grant-1",
            title: "Grant",
            organization: { id: "org-1", name: "Org", slug: "org" },
          },
          _count: { votes: 0, comments: 0, applications: 50 },
        },
      ];

      vi.mocked(database.rFP.findMany).mockResolvedValue(mockRFPs as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps?sort=most_applications"
      );
      const response = await getRFPs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.sort).toBe("most_applications");
    });

    test("should handle least_applications sorting", async () => {
      const mockRFPs = [
        {
          id: "rfp-1",
          title: "Low Application RFP",
          status: "OPEN",
          visibility: "PUBLISHED",
          grant: {
            id: "grant-1",
            title: "Grant",
            organization: { id: "org-1", name: "Org", slug: "org" },
          },
          _count: { votes: 0, comments: 0, applications: 1 },
        },
      ];

      vi.mocked(database.rFP.findMany).mockResolvedValue(mockRFPs as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps?sort=least_applications"
      );
      const response = await getRFPs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.sort).toBe("least_applications");
    });

    test("should default to recent sorting", async () => {
      const mockRFPs = [
        {
          id: "rfp-1",
          title: "Recent RFP",
          status: "OPEN",
          visibility: "PUBLISHED",
          publishedAt: new Date(),
          grant: {
            id: "grant-1",
            title: "Grant",
            organization: { id: "org-1", name: "Org", slug: "org" },
          },
          _count: { votes: 0, comments: 0, applications: 0 },
        },
      ];

      vi.mocked(database.rFP.findMany).mockResolvedValue(mockRFPs as any);

      const request = new NextRequest("http://localhost:3002/api/v1/rfps");
      const response = await getRFPs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.sort).toBe("recent");
    });
  });

  describe("GET /api/v1/rfps/[id]", () => {
    test("should return RFP details with votes and comments", async () => {
      const mockRFP = {
        id: "rfp-1",
        title: "Test RFP",
        slug: "test-rfp",
        description: "Detailed RFP description",
        status: "OPEN",
        visibility: "PUBLIC",
        viewCount: 100,
        grant: {
          id: "grant-1",
          title: "Test Grant",
          slug: "test-grant",
          organization: {
            id: "org-1",
            name: "Test Organization",
            slug: "test-org",
          },
        },
        votes: [
          {
            id: "vote-1",
            userId: "user-1",
            value: 1,
            user: {
              id: "user-1",
              username: "voter1",
            },
          },
        ],
        comments: [
          {
            id: "comment-1",
            content: "Great RFP!",
            authorId: "user-2",
            author: {
              id: "user-2",
              username: "commenter1",
              firstName: "John",
              lastName: "Doe",
            },
            createdAt: new Date(),
          },
        ],
        _count: {
          votes: 1,
          comments: 1,
          applications: 0,
        },
      };

      vi.mocked(database.rFP.findFirst).mockResolvedValue(mockRFP as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/rfps/rfp-1"
      );
      const response = await getRFP(request, {
        params: Promise.resolve({ id: "rfp-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.rfp.id).toBe("rfp-1");
      expect(data.rfp.votes).toHaveLength(1);
      expect(data.rfp.comments).toHaveLength(1);
    });
  });

  describe("POST /api/v1/organizations/[organizationId]/rfps", () => {
    test("should create RFP for organization member with atomic transaction", async () => {
      const mockSession = {
        user: {
          id: "member-1",
          email: "member@org.com",
        },
      };

      const mockRFP = {
        id: "rfp-new",
        title: "New RFP",
        slug: "new-rfp",
        description: "New RFP description",
        grantId: "grant-1",
        status: "OPEN",
        visibility: "PUBLISHED",
        createdAt: new Date(),
        grant: {
          id: "grant-1",
          title: "Test Grant",
          slug: "test-grant",
        },
      };

      // Mock transaction to return the RFP
      vi.mocked(database.$transaction).mockImplementation(async (callback) => {
        return await callback({
          rFP: {
            create: vi.fn().mockResolvedValue(mockRFP),
          },
          grant: {
            update: vi.fn().mockResolvedValue({}),
          },
        } as any);
      });

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      // Member with required role
      vi.mocked(database.member.findFirst).mockResolvedValue({
        organizationId: "org-1",
        userId: "member-1",
        role: "owner",
      } as any);
      // Grant belongs to organization
      vi.mocked(database.grant.findFirst).mockResolvedValue({
        id: "grant-1",
        organizationId: "org-1",
      } as any);
      // Slug unique
      vi.mocked(database.rFP.findUnique).mockResolvedValue(null as any);

      const body = JSON.stringify({
        title: "New RFP",
        description: "New RFP description",
        grantId: "grant-1",
        visibility: "PUBLISHED",
      });

      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/rfps",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createRFP(request, {
        params: Promise.resolve({ organizationId: "org-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.rfp.title).toBe("New RFP");

      // Verify transaction was called
      expect(database.$transaction).toHaveBeenCalledTimes(1);
    });

    test("should handle transaction failure gracefully", async () => {
      const mockSession = {
        user: {
          id: "member-1",
          email: "member@org.com",
        },
      };

      // Mock transaction to throw an error
      vi.mocked(database.$transaction).mockRejectedValue(
        new Error("Transaction failed")
      );

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      vi.mocked(database.member.findFirst).mockResolvedValue({
        organizationId: "org-1",
        userId: "member-1",
        role: "owner",
      } as any);
      vi.mocked(database.grant.findFirst).mockResolvedValue({
        id: "grant-1",
        organizationId: "org-1",
      } as any);
      vi.mocked(database.rFP.findUnique).mockResolvedValue(null as any);

      const body = JSON.stringify({
        title: "New RFP",
        description: "New RFP description",
        grantId: "grant-1",
        visibility: "PUBLISHED",
      });

      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/rfps",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createRFP(request, {
        params: Promise.resolve({ organizationId: "org-1" }),
      });

      expect(response.status).toBe(500);
    });

    test("should require organization membership", async () => {
      const mockSession = {
        user: {
          id: "non-member",
          email: "user@example.com",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
      // Not a member → route returns 403 before any grant checks
      vi.mocked(database.member.findFirst).mockResolvedValue(null as any);

      const body = JSON.stringify({
        title: "New RFP",
        description: "Description",
        grantId: "grant-1",
      });

      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/rfps",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createRFP(request, {
        params: Promise.resolve({ organizationId: "org-1" }),
      });

      expect(response.status).toBe(403);
    });
  });
});
