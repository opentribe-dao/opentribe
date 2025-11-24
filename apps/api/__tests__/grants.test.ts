import { database } from "@packages/db";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  GET as getGrants,
  OPTIONS as optionsGrant,
} from "../app/api/v1/grants/route";
import { POST as createGrant } from "../app/api/v1/organizations/[organizationId]/grants/route";
import { getOrganizationAuth } from "../lib/organization-auth";

// Mock database
vi.mock("@packages/db", () => ({
  database: {
    grant: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    member: {
      findFirst: vi.fn(),
    },
    curator: {
      create: vi.fn(),
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

// Mock organization-auth
vi.mock("../lib/organization-auth", () => ({
  getOrganizationAuth: vi.fn(),
  hasRequiredRole: vi.fn((membership, roles) => {
    return roles.includes(membership.role);
  }),
}));

// Mock headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

describe("Grant Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/grants", () => {
    const mockGrant = {
      id: "grant-1",
      title: "Test Grant",
      slug: "test-grant",
      description: "Test description",
      summary: "Test summary",
      instructions: "Test instructions",
      logoUrl: "https://example.com/logo.png",
      bannerUrl: "https://example.com/banner.png",
      skills: ["React", "TypeScript"],
      minAmount: 1000,
      maxAmount: 5000,
      totalFunds: 10_000,
      token: "DOT",
      resources: [
        {
          title: "Resource 1",
          url: "https://example.com/resource1",
          description: "Resource description",
        },
      ],
      screening: [
        {
          question: "What is your experience?",
          type: "text" as const,
          optional: false,
        },
      ],
      applicationUrl: "https://example.com/apply",
      visibility: "PUBLISHED" as const,
      source: "NATIVE" as const,
      status: "OPEN" as const,
      organizationId: "org-1",
      publishedAt: new Date("2024-01-01"),
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      applicationCount: 5,
      rfpCount: 2,
      organization: {
        id: "org-1",
        name: "Test Organization",
        slug: "test-org",
        logo: "https://example.com/org-logo.png",
        location: "San Francisco",
        industry: ["Technology"],
      },
    };

    test("should return list of published grants with default filters", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest("http://localhost:3002/api/v1/grants");
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.grants).toHaveLength(1);
      expect(data.grants[0].title).toBe("Test Grant");
      expect(data.grants[0].applicationCount).toBe(5);
      expect(data.grants[0].rfpCount).toBe(2);
      expect(data.grants[0].minAmount).toBe(1000);
      expect(data.grants[0].maxAmount).toBe(5000);
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.hasMore).toBe(false);
      expect(data.filters.statuses).toEqual([]);
      expect(data.filters.sort).toBe("newest"); // Fixed: should be lowercase
    });

    test("should filter grants by status list", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?status=OPEN,CLOSED"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.statuses).toEqual(["OPEN", "CLOSED"]);
    });

    test("should filter grants by single status", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?status=OPEN"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.statuses).toEqual(["OPEN"]);
    });

    test("should filter grants by skills", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?skills=React,TypeScript"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.skills).toEqual(["React", "TypeScript"]);
    });

    // Remove source filter test as it's not implemented in the API
    // test("should filter grants by source", async () => { ... });

    test("should search grants by title, description, summary, skills, and organization", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?search=React"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.search).toBe("React");
    });

    test("should sort grants by NEWEST (default)", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?sort=NEWEST"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.sort).toBe("NEWEST");
    });

    test("should sort grants by OLDEST", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?sort=OLDEST"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.sort).toBe("OLDEST");
    });

    test("should sort grants by NEWEST (case insensitive)", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?sort=newest"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.sort).toBe("newest");
    });

    test("should sort grants by OLDEST (case insensitive)", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?sort=oldest"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.sort).toBe("oldest");
    });

    test("should sort grants by MAX_AMOUNT", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?sort=MAX_AMOUNT"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.sort).toBe("MAX_AMOUNT");
    });

    test("should sort grants by MIN_AMOUNT", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?sort=MIN_AMOUNT"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.sort).toBe("MIN_AMOUNT");
    });

    test("should sort grants by MAX_FUNDS", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?sort=MAX_FUNDS"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.sort).toBe("MAX_FUNDS");
    });

    test("should sort grants by MOST_APPLICATIONS", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?sort=MOST_APPLICATIONS"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.sort).toBe("MOST_APPLICATIONS");
    });

    test("should sort grants by MOST_RFPs", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?sort=MOST_RFPs"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.sort).toBe("MOST_RFPs");
    });

    test("should filter grants by minAmount only", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?minAmount=500"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.minAmount).toBe("500");
    });

    test("should filter grants by maxAmount only", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?maxAmount=10000"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.maxAmount).toBe("10000");
    });

    test("should filter grants by both minAmount and maxAmount", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?minAmount=500&maxAmount=10000"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.minAmount).toBe("500");
      expect(data.filters.maxAmount).toBe("10000");
    });

    // Remove applicationCount filter tests as they don't exist in the API
    // The API uses sort parameter instead

    test("should handle pagination with hasMore", async () => {
      const mockGrants = [
        mockGrant,
        { ...mockGrant, id: "grant-2" },
        { ...mockGrant, id: "grant-3" },
      ];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?limit=2"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.grants).toHaveLength(2);
      expect(data.pagination.hasMore).toBe(true);
    });

    test("should handle pagination without hasMore", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?limit=10"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.grants).toHaveLength(1);
      expect(data.pagination.hasMore).toBe(false);
    });

    test("should handle URL encoded skills parameter", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?skills=React%2CTypeScript%2CNode.js"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.skills).toEqual(["React", "TypeScript", "Node.js"]);
    });

    test("should handle URL encoded status parameter", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?status=OPEN%2CCLOSED"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.statuses).toEqual(["OPEN", "CLOSED"]);
    });

    test("should filter out invalid status values", async () => {
      const mockGrants = [mockGrant];

      vi.mocked(database.grant.findMany).mockResolvedValue(mockGrants as any);

      const request = new NextRequest(
        "http://localhost:3002/api/v1/grants?status=OPEN,INVALID,CLOSED"
      );
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters.statuses).toEqual(["OPEN", "CLOSED"]);
    });

    test("should handle grants with null minAmount and maxAmount", async () => {
      const mockGrantWithNullAmounts = {
        ...mockGrant,
        minAmount: null,
        maxAmount: null,
      };

      vi.mocked(database.grant.findMany).mockResolvedValue([
        mockGrantWithNullAmounts,
      ] as any);

      const request = new NextRequest("http://localhost:3002/api/v1/grants");
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.grants[0].minAmount).toBeUndefined();
      expect(data.grants[0].maxAmount).toBeUndefined();
    });

    test("should handle grants with only minAmount", async () => {
      const mockGrantWithMinOnly = {
        ...mockGrant,
        minAmount: 1000,
        maxAmount: null,
      };

      vi.mocked(database.grant.findMany).mockResolvedValue([
        mockGrantWithMinOnly,
      ] as any);

      const request = new NextRequest("http://localhost:3002/api/v1/grants");
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.grants[0].minAmount).toBe(1000);
      expect(data.grants[0].maxAmount).toBeUndefined();
    });

    test("should handle grants with only maxAmount", async () => {
      const mockGrantWithMaxOnly = {
        ...mockGrant,
        minAmount: null,
        maxAmount: 5000,
      };

      vi.mocked(database.grant.findMany).mockResolvedValue([
        mockGrantWithMaxOnly,
      ] as any);

      const request = new NextRequest("http://localhost:3002/api/v1/grants");
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.grants[0].minAmount).toBeUndefined();
      expect(data.grants[0].maxAmount).toBe(5000);
    });

    test("should handle database error", async () => {
      vi.mocked(database.grant.findMany).mockRejectedValue(
        new Error("Database error")
      );

      const request = new NextRequest("http://localhost:3002/api/v1/grants");
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch grants");
      expect(data.details).toBe("Database error");
    });

    test("should handle non-Error exception", async () => {
      vi.mocked(database.grant.findMany).mockRejectedValue("String error");

      const request = new NextRequest("http://localhost:3002/api/v1/grants");
      const response = await getGrants(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch grants");
      expect(data.details).toBe("Unknown error");
    });
  });

  describe("POST /api/v1/grants", () => {
    const mockSession = {
      user: {
        id: "user-1",
        email: "test@example.com",
      },
    };

    const mockCurator = {
      user: {
        id: "user-1",
        email: "test@example.com",
      },
      grantId: "grant-1",
      contact: "test@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockMembership = {
      id: "member-1",
      userId: "user-1",
      organizationId: "org-1",
      role: "admin" as const,
    };

    const mockGrant = {
      id: "grant-1",
      title: "Test Grant",
      slug: "test-grant",
      description: "Test description",
      summary: "Test summary",
      instructions: "Test instructions",
      logoUrl: "https://example.com/logo.png",
      bannerUrl: "https://example.com/banner.png",
      skills: ["React", "TypeScript"],
      minAmount: 1000,
      maxAmount: 5000,
      totalFunds: 10_000,
      token: "DOT",
      resources: [
        {
          title: "Resource 1",
          url: "https://example.com/resource1",
          description: "Resource description",
        },
      ],
      screening: [
        {
          question: "What is your experience?",
          type: "text" as const,
          optional: false,
        },
      ],
      applicationUrl: "https://example.com/apply",
      visibility: "PUBLISHED" as const,
      source: "NATIVE" as const,
      status: "OPEN" as const,
      organizationId: "org-1",
      publishedAt: new Date("2024-01-01"),
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      organization: {
        id: "org-1",
        name: "Test Organization",
        logo: "https://example.com/org-logo.png",
      },
    };

    test("should create grant successfully", async () => {
      const { auth } = await import("@packages/auth/server");
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: mockSession.user.id,
        organizationId: "org-1",
        membership: {
          id: mockMembership.id,
          role: mockMembership.role as "owner" | "admin" | "member",
          userId: mockSession.user.id,
          organizationId: "org-1",
        },
      });
      vi.mocked(database.grant.findUnique).mockResolvedValue(null);
      vi.mocked(database.grant.create).mockResolvedValue(mockGrant as any);
      vi.mocked(database.curator.create).mockResolvedValue(mockCurator as any);

      const requestBody = {
        title: "Test Grant",
        description: "Test description",
        summary: "Test summary",
        instructions: "Test instructions",
        logoUrl: "https://example.com/logo.png",
        bannerUrl: "https://example.com/banner.png",
        skills: ["React", "TypeScript"],
        minAmount: 1000,
        maxAmount: 5000,
        totalFunds: 10_000,
        token: "DOT",
        resources: [
          {
            title: "Resource 1",
            url: "https://example.com/resource1",
            description: "Resource description",
          },
        ],
        screening: [
          {
            question: "What is your experience?",
            type: "text" as const,
            optional: false,
          },
        ],
        applicationUrl: "https://example.com/apply",
        visibility: "PUBLISHED" as const,
        source: "NATIVE" as const,
      };

      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/grants",
        {
          method: "POST",
          body: JSON.stringify(requestBody),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await createGrant(request, {
        params: Promise.resolve({ organizationId: "org-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.grant.title).toBe("Test Grant");
    });

    test("should create grant with minimal required fields", async () => {
      const { auth } = await import("@packages/auth/server");
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: mockSession.user.id,
        organizationId: "org-1",
        membership: {
          id: mockMembership.id,
          role: mockMembership.role as "owner" | "admin" | "member",
          userId: mockSession.user.id,
          organizationId: "org-1",
        },
      });
      vi.mocked(database.grant.findUnique).mockResolvedValue(null);
      vi.mocked(database.grant.create).mockResolvedValue(mockGrant as any);
      vi.mocked(database.curator.create).mockResolvedValue(mockCurator as any);

      const requestBody = {
        title: "Test Grant",
        description: "Test description",
        organizationId: "org-1",
      };

      // Remove organizationId from body if present
      const { organizationId: _, ...grantDataWithoutOrgId } =
        requestBody as any;
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/grants",
        {
          method: "POST",
          body: JSON.stringify(grantDataWithoutOrgId),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await createGrant(request, {
        params: Promise.resolve({ organizationId: "org-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test("should return 401 when user is not authenticated", async () => {
      const { auth } = await import("@packages/auth/server");
      vi.mocked(auth.api.getSession).mockResolvedValue(null);
      vi.mocked(getOrganizationAuth).mockResolvedValue(null);

      const requestBody = {
        title: "Test Grant",
        description: "Test description",
        organizationId: "org-1",
      };

      // Remove organizationId from body if present
      const { organizationId: _, ...grantDataWithoutOrgId } =
        requestBody as any;
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/grants",
        {
          method: "POST",
          body: JSON.stringify(grantDataWithoutOrgId),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await createGrant(request, {
        params: Promise.resolve({ organizationId: "org-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    test("should return 401 when user is not a member of the organization", async () => {
      const { auth } = await import("@packages/auth/server");
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
      vi.mocked(getOrganizationAuth).mockResolvedValue(null);

      const requestBody = {
        title: "Test Grant",
        description: "Test description",
        organizationId: "org-1",
      };

      // Remove organizationId from body if present
      const { organizationId: _, ...grantDataWithoutOrgId } =
        requestBody as any;
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/grants",
        {
          method: "POST",
          body: JSON.stringify(grantDataWithoutOrgId),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await createGrant(request, {
        params: Promise.resolve({ organizationId: "org-1" }),
      });
      const data = await response.json();

      // Note: Route returns 401 when getOrganizationAuth returns null
      // Middleware would return 403, but in tests we call route directly
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    test("should return 403 when user is not owner or admin", async () => {
      const { auth } = await import("@packages/auth/server");
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: mockSession.user.id,
        organizationId: "org-1",
        membership: {
          id: "member-1",
          role: "member",
          userId: mockSession.user.id,
          organizationId: "org-1",
        },
      });

      const requestBody = {
        title: "Test Grant",
        description: "Test description",
        organizationId: "org-1",
      };

      // Remove organizationId from body if present
      const { organizationId: _, ...grantDataWithoutOrgId } =
        requestBody as any;
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/grants",
        {
          method: "POST",
          body: JSON.stringify(grantDataWithoutOrgId),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await createGrant(request, {
        params: Promise.resolve({ organizationId: "org-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe(
        "You do not have permission to create grants for this organization"
      );
    });

    test("should return 400 when minAmount is greater than maxAmount", async () => {
      const { auth } = await import("@packages/auth/server");
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: mockSession.user.id,
        organizationId: "org-1",
        membership: {
          id: mockMembership.id,
          role: mockMembership.role as "owner" | "admin" | "member",
          userId: mockSession.user.id,
          organizationId: "org-1",
        },
      });

      const requestBody = {
        title: "Test Grant",
        description: "Test description",
        minAmount: 5000,
        maxAmount: 1000,
        organizationId: "org-1",
      };

      // Remove organizationId from body if present
      const { organizationId: _, ...grantDataWithoutOrgId } =
        requestBody as any;
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/grants",
        {
          method: "POST",
          body: JSON.stringify(grantDataWithoutOrgId),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await createGrant(request, {
        params: Promise.resolve({ organizationId: "org-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Minimum amount cannot be greater than maximum amount"
      );
    });

    test("should return 400 for invalid data (ZodError)", async () => {
      const { auth } = await import("@packages/auth/server");
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);

      const requestBody = {
        title: "", // Invalid: empty title
        description: "Test description",
        organizationId: "org-1",
      };

      // Remove organizationId from body if present
      const { organizationId: _, ...grantDataWithoutOrgId } =
        requestBody as any;
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/grants",
        {
          method: "POST",
          body: JSON.stringify(grantDataWithoutOrgId),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await createGrant(request, {
        params: Promise.resolve({ organizationId: "org-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.message).toBeDefined();
      expect(data.details).toBeDefined();
    });

    test("should handle slug generation with existing slug", async () => {
      const { auth } = await import("@packages/auth/server");
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: mockSession.user.id,
        organizationId: "org-1",
        membership: {
          id: mockMembership.id,
          role: mockMembership.role as "owner" | "admin" | "member",
          userId: mockSession.user.id,
          organizationId: "org-1",
        },
      });
      vi.mocked(database.grant.findUnique)
        .mockResolvedValueOnce({ id: "existing-grant" } as any) // First check finds existing
        .mockResolvedValueOnce(null); // Second check finds available
      vi.mocked(database.grant.create).mockResolvedValue(mockGrant as any);
      vi.mocked(database.curator.create).mockResolvedValue(mockCurator as any);

      const requestBody = {
        title: "Test Grant",
        description: "Test description",
        organizationId: "org-1",
      };

      // Remove organizationId from body if present
      const { organizationId: _, ...grantDataWithoutOrgId } =
        requestBody as any;
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/grants",
        {
          method: "POST",
          body: JSON.stringify(grantDataWithoutOrgId),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await createGrant(request, {
        params: Promise.resolve({ organizationId: "org-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(database.grant.findUnique).toHaveBeenCalledTimes(2);
    });

    test("should create grant with DRAFT visibility", async () => {
      const { auth } = await import("@packages/auth/server");
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: mockSession.user.id,
        organizationId: "org-1",
        membership: {
          id: mockMembership.id,
          role: mockMembership.role as "owner" | "admin" | "member",
          userId: mockSession.user.id,
          organizationId: "org-1",
        },
      });
      vi.mocked(database.grant.findUnique).mockResolvedValue(null);
      vi.mocked(database.curator.create).mockResolvedValue(mockCurator as any);
      vi.mocked(database.grant.create).mockResolvedValue({
        ...mockGrant,
        visibility: "DRAFT",
        publishedAt: null,
      } as any);

      const requestBody = {
        title: "Test Grant",
        description: "Test description",
        visibility: "DRAFT" as const,
        organizationId: "org-1",
      };

      // Remove organizationId from body if present
      const { organizationId: _, ...grantDataWithoutOrgId } =
        requestBody as any;
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/grants",
        {
          method: "POST",
          body: JSON.stringify(grantDataWithoutOrgId),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await createGrant(request, {
        params: Promise.resolve({ organizationId: "org-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test("should handle database error during grant creation", async () => {
      const { auth } = await import("@packages/auth/server");
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: mockSession.user.id,
        organizationId: "org-1",
        membership: {
          id: mockMembership.id,
          role: mockMembership.role as "owner" | "admin" | "member",
          userId: mockSession.user.id,
          organizationId: "org-1",
        },
      });
      vi.mocked(database.grant.findUnique).mockResolvedValue(null);
      vi.mocked(database.grant.create).mockRejectedValue(
        new Error("Database error")
      );

      const requestBody = {
        title: "Test Grant",
        description: "Test description",
        organizationId: "org-1",
      };

      // Remove organizationId from body if present
      const { organizationId: _, ...grantDataWithoutOrgId } =
        requestBody as any;
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/grants",
        {
          method: "POST",
          body: JSON.stringify(grantDataWithoutOrgId),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await createGrant(request, {
        params: Promise.resolve({ organizationId: "org-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create grant");
    });

    test("should handle non-ZodError during grant creation", async () => {
      const { auth } = await import("@packages/auth/server");
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: mockSession.user.id,
        organizationId: "org-1",
        membership: {
          id: mockMembership.id,
          role: mockMembership.role as "owner" | "admin" | "member",
          userId: mockSession.user.id,
          organizationId: "org-1",
        },
      });
      vi.mocked(database.grant.findUnique).mockResolvedValue(null);
      vi.mocked(database.grant.create).mockRejectedValue("String error");

      const requestBody = {
        title: "Test Grant",
        description: "Test description",
        organizationId: "org-1",
      };

      // Remove organizationId from body if present
      const { organizationId: _, ...grantDataWithoutOrgId } =
        requestBody as any;
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/grants",
        {
          method: "POST",
          body: JSON.stringify(grantDataWithoutOrgId),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const response = await createGrant(request, {
        params: Promise.resolve({ organizationId: "org-1" }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create grant");
    });
  });

  describe("OPTIONS /api/v1/grants", () => {
    test("should return CORS headers", async () => {
      const response = await optionsGrant();

      expect(response.status).toBe(200);
    });
  });
});
