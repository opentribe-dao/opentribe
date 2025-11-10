import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET as getGrant } from "../app/api/v1/grants/[id]/route";

// Mock database
vi.mock("@packages/db", () => ({
  database: {
    grant: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    view: {
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    member: {
      count: vi.fn(),
    },
    grantApplication: {
      findFirst: vi.fn(),
    },
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

// Mock headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

describe("GET /api/v1/grants/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockGrant = {
    id: "grant-1",
    title: "Test Grant",
    slug: "test-grant",
    description: "Test description",
    organizationId: "org-1",
    status: "OPEN",
    visibility: "PUBLISHED",
    organization: {
      id: "org-1",
      name: "Test Organization",
      slug: "test-org",
      logo: null,
      location: null,
      industry: [],
    },
    curators: [],
    rfps: [],
    applications: [],
    _count: {
      applications: 0,
      rfps: 0,
      curators: 0,
    },
  };

  test("should return grant details", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    vi.mocked(database.grant.findFirst).mockResolvedValue(mockGrant as any);
    vi.mocked(database.grant.update).mockResolvedValue(mockGrant as any);
    vi.mocked(database.member.count).mockResolvedValue(0);
    vi.mocked(database.grantApplication.findFirst).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3002/api/v1/grants/grant-1"
    );
    const response = await getGrant(request, {
      params: Promise.resolve({ id: "grant-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.grant.id).toBe("grant-1");
    expect(data.grant.title).toBe("Test Grant");
  });

  test("should return 404 for non-existent grant", async () => {
    vi.mocked(database.grant.findFirst).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3002/api/v1/grants/invalid-id"
    );
    const response = await getGrant(request, {
      params: Promise.resolve({ id: "invalid-id" }),
    });

    expect(response.status).toBe(404);
  });

  test("should set canApply=false for organization members", async () => {
    const mockSession = {
      user: { id: "user-1", email: "user@example.com" },
    };

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(database.grant.findFirst).mockResolvedValue(mockGrant as any);
    vi.mocked(database.grant.update).mockResolvedValue(mockGrant as any);
    vi.mocked(database.member.count).mockResolvedValue(1); // User is a member
    vi.mocked(database.grantApplication.findFirst).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3002/api/v1/grants/grant-1"
    );
    const response = await getGrant(request, {
      params: Promise.resolve({ id: "grant-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.grant.canApply).toBe(false);
    expect(data.grant.userApplicationId).toBe(null);
    expect(database.member.count).toHaveBeenCalledWith({
      where: {
        organizationId: "org-1",
        userId: "user-1",
      },
    });
  });

  test("should set canApply=true for non-members without existing application", async () => {
    const mockSession = {
      user: { id: "user-1", email: "user@example.com" },
    };

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(database.grant.findFirst).mockResolvedValue(mockGrant as any);
    vi.mocked(database.grant.update).mockResolvedValue(mockGrant as any);
    vi.mocked(database.member.count).mockResolvedValue(0); // User is NOT a member
    vi.mocked(database.grantApplication.findFirst).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3002/api/v1/grants/grant-1"
    );
    const response = await getGrant(request, {
      params: Promise.resolve({ id: "grant-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.grant.canApply).toBe(true);
    expect(data.grant.userApplicationId).toBe(null);
  });

  test("should set canApply=false when user already applied", async () => {
    const mockSession = {
      user: { id: "user-1", email: "user@example.com" },
    };

    const mockApplication = {
      id: "application-1",
      grantId: "grant-1",
      userId: "user-1",
      title: "My Application",
    };

    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(database.grant.findFirst).mockResolvedValue(mockGrant as any);
    vi.mocked(database.grant.update).mockResolvedValue(mockGrant as any);
    vi.mocked(database.member.count).mockResolvedValue(0);
    vi.mocked(database.grantApplication.findFirst).mockResolvedValue(
      mockApplication as any
    );

    const request = new NextRequest(
      "http://localhost:3002/api/v1/grants/grant-1"
    );
    const response = await getGrant(request, {
      params: Promise.resolve({ id: "grant-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.grant.canApply).toBe(false);
    expect(data.grant.userApplicationId).toBe("application-1");
    expect(database.grantApplication.findFirst).toHaveBeenCalledWith({
      where: {
        grantId: "grant-1",
        userId: "user-1",
      },
    });
  });

  test("should set canApply=true for unauthenticated users", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null); // No session
    vi.mocked(database.grant.findFirst).mockResolvedValue(mockGrant as any);
    vi.mocked(database.grant.update).mockResolvedValue(mockGrant as any);
    vi.mocked(database.member.count).mockResolvedValue(0);
    vi.mocked(database.grantApplication.findFirst).mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3002/api/v1/grants/grant-1"
    );
    const response = await getGrant(request, {
      params: Promise.resolve({ id: "grant-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.grant.canApply).toBe(true);
    expect(data.grant.userApplicationId).toBe(null);
  });
});
