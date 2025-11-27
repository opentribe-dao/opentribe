import { database } from "@packages/db";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET as getCurators } from "../app/api/v1/bounties/[id]/curators/route";
import { POST as addCurator } from "../app/api/v1/organizations/[organizationId]/bounties/[id]/curators/route";
import { DELETE as removeCurator } from "../app/api/v1/organizations/[organizationId]/bounties/[id]/curators/[curatorId]/route";
import { getOrganizationAuth } from "../lib/organization-auth";

// Mock database
vi.mock("@packages/db", () => ({
  database: {
    bounty: {
      findFirst: vi.fn(),
    },
    curator: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    member: {
      findUnique: vi.fn(),
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

describe("Curators API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // GET /api/v1/bounties/[id]/curators
  // ==========================================================================
  describe("GET /api/v1/bounties/[id]/curators", () => {
    test("should return list of curators for a bounty", async () => {
      // Arrange
      const mockBounty = {
        id: "bounty-1",
      };

      const mockCurators = [
        {
          id: "curator-1",
          bountyId: "bounty-1",
          userId: "user-1",
          contact: "user1@example.com",
          createdAt: new Date(),
          user: {
            id: "user-1",
            name: "John Doe",
            email: "user1@example.com",
            image: null,
            username: "johndoe",
          },
        },
        {
          id: "curator-2",
          bountyId: "bounty-1",
          userId: "user-2",
          contact: "user2@example.com",
          createdAt: new Date(),
          user: {
            id: "user-2",
            name: "Jane Smith",
            email: "user2@example.com",
            image: "https://example.com/avatar.jpg",
            username: "janesmith",
          },
        },
      ];

      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);
      vi.mocked(database.curator.findMany).mockResolvedValue(
        mockCurators as any
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/curators"
      );
      const response = await getCurators(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.curators).toHaveLength(2);
      expect(data.curators[0].user.name).toBe("John Doe");
      expect(data.curators[1].user.name).toBe("Jane Smith");
      expect(database.bounty.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ id: "bounty-1" }, { slug: "bounty-1" }],
          visibility: "PUBLISHED",
        },
        select: { id: true },
      });
    });

    test("should return empty array when no curators exist", async () => {
      // Arrange
      const mockBounty = { id: "bounty-1" };

      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);
      vi.mocked(database.curator.findMany).mockResolvedValue([]);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/curators"
      );
      const response = await getCurators(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.curators).toHaveLength(0);
    });

    test("should return 404 for non-existent bounty", async () => {
      // Arrange
      vi.mocked(database.bounty.findFirst).mockResolvedValue(null);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/non-existent/curators"
      );
      const response = await getCurators(request, {
        params: Promise.resolve({
          id: "non-existent",
        }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Bounty not found");
    });

    test("should support looking up bounty by slug", async () => {
      // Arrange
      const mockBounty = { id: "bounty-1" };
      const mockCurators = [
        {
          id: "curator-1",
          bountyId: "bounty-1",
          userId: "user-1",
          user: {
            id: "user-1",
            name: "Test User",
            email: "test@example.com",
            image: null,
            username: "testuser",
          },
        },
      ];

      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);
      vi.mocked(database.curator.findMany).mockResolvedValue(
        mockCurators as any
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/my-bounty-slug/curators"
      );
      const response = await getCurators(request, {
        params: Promise.resolve({
          id: "my-bounty-slug",
        }),
      });

      // Assert
      expect(response.status).toBe(200);
      expect(database.bounty.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ id: "my-bounty-slug" }, { slug: "my-bounty-slug" }],
          visibility: "PUBLISHED",
        },
        select: { id: true },
      });
    });

    test("should handle database errors gracefully", async () => {
      // Arrange
      vi.mocked(database.bounty.findFirst).mockRejectedValue(
        new Error("Database error")
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/bounties/bounty-1/curators"
      );
      const response = await getCurators(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch curators");
    });
  });

  // ==========================================================================
  // POST /api/v1/organizations/[organizationId]/bounties/[id]/curators
  // ==========================================================================
  describe("POST /api/v1/organizations/[organizationId]/bounties/[id]/curators", () => {
    test("should add a curator successfully as organization owner", async () => {
      // Arrange
      const mockBounty = { id: "bounty-1", status: "OPEN" };
      const mockMember = {
        id: "member-1",
        userId: "user-to-add",
        organizationId: "org-1",
        role: "member",
        user: { email: "newcurator@example.com" },
      };
      const mockCreatedCurator = {
        id: "curator-new",
        bountyId: "bounty-1",
        userId: "user-to-add",
        contact: "newcurator@example.com",
        user: {
          id: "user-to-add",
          name: "New Curator",
          email: "newcurator@example.com",
          image: null,
          username: "newcurator",
        },
      };

      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "admin-user",
        organizationId: "org-1",
        membership: {
          id: "admin-member",
          userId: "admin-user",
          organizationId: "org-1",
          role: "owner",
        },
      } as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);
      vi.mocked(database.member.findUnique).mockResolvedValue(
        mockMember as any
      );
      vi.mocked(database.curator.findFirst).mockResolvedValue(null); // Not already a curator
      vi.mocked(database.curator.create).mockResolvedValue(
        mockCreatedCurator as any
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators",
        {
          method: "POST",
          body: JSON.stringify({ userId: "user-to-add" }),
        }
      );
      const response = await addCurator(request, {
        params: Promise.resolve({ organizationId: "org-1", id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.curator.id).toBe("curator-new");
      expect(data.curator.user.name).toBe("New Curator");
      expect(database.curator.create).toHaveBeenCalledWith({
        data: {
          bountyId: "bounty-1",
          userId: "user-to-add",
          contact: "newcurator@example.com",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              username: true,
            },
          },
        },
      });
    });

    test("should add a curator successfully as organization admin", async () => {
      // Arrange
      const mockBounty = { id: "bounty-1", status: "OPEN" };
      const mockMember = {
        id: "member-1",
        userId: "user-to-add",
        organizationId: "org-1",
        user: { email: "curator@example.com" },
      };
      const mockCreatedCurator = {
        id: "curator-new",
        bountyId: "bounty-1",
        userId: "user-to-add",
        user: {
          id: "user-to-add",
          name: "New Curator",
          email: "curator@example.com",
          image: null,
          username: "newcurator",
        },
      };

      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "admin-user",
        organizationId: "org-1",
        membership: {
          id: "admin-member",
          userId: "admin-user",
          organizationId: "org-1",
          role: "admin",
        },
      } as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);
      vi.mocked(database.member.findUnique).mockResolvedValue(
        mockMember as any
      );
      vi.mocked(database.curator.findFirst).mockResolvedValue(null);
      vi.mocked(database.curator.create).mockResolvedValue(
        mockCreatedCurator as any
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators",
        {
          method: "POST",
          body: JSON.stringify({ userId: "user-to-add" }),
        }
      );
      const response = await addCurator(request, {
        params: Promise.resolve({ organizationId: "org-1", id: "bounty-1" }),
      });

      // Assert
      expect(response.status).toBe(200);
    });

    test("should return 401 for unauthenticated users", async () => {
      // Arrange
      vi.mocked(getOrganizationAuth).mockResolvedValue(null);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators",
        {
          method: "POST",
          body: JSON.stringify({ userId: "user-to-add" }),
        }
      );
      const response = await addCurator(request, {
        params: Promise.resolve({ organizationId: "org-1", id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    test("should return 403 for regular members (not owner/admin)", async () => {
      // Arrange
      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "regular-user",
        organizationId: "org-1",
        membership: {
          id: "member-1",
          userId: "regular-user",
          organizationId: "org-1",
          role: "member",
        },
      } as any);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators",
        {
          method: "POST",
          body: JSON.stringify({ userId: "user-to-add" }),
        }
      );
      const response = await addCurator(request, {
        params: Promise.resolve({ organizationId: "org-1", id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toBe("Only owners and admins can add curators");
    });

    test("should return 404 for non-existent bounty", async () => {
      // Arrange
      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "admin-user",
        organizationId: "org-1",
        membership: {
          id: "admin-member",
          userId: "admin-user",
          organizationId: "org-1",
          role: "owner",
        },
      } as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(null);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/non-existent/curators",
        {
          method: "POST",
          body: JSON.stringify({ userId: "user-to-add" }),
        }
      );
      const response = await addCurator(request, {
        params: Promise.resolve({
          organizationId: "org-1",
          id: "non-existent",
        }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Bounty not found");
    });

    test("should return 400 when bounty is completed", async () => {
      // Arrange
      const mockBounty = { id: "bounty-1", status: "COMPLETED" };

      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "admin-user",
        organizationId: "org-1",
        membership: {
          id: "admin-member",
          userId: "admin-user",
          organizationId: "org-1",
          role: "owner",
        },
      } as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators",
        {
          method: "POST",
          body: JSON.stringify({ userId: "user-to-add" }),
        }
      );
      const response = await addCurator(request, {
        params: Promise.resolve({ organizationId: "org-1", id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Cannot add curators to a bounty that is completed, closed, or cancelled"
      );
    });

    test("should return 400 when bounty is closed", async () => {
      // Arrange
      const mockBounty = { id: "bounty-1", status: "CLOSED" };

      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "admin-user",
        organizationId: "org-1",
        membership: {
          id: "admin-member",
          userId: "admin-user",
          organizationId: "org-1",
          role: "owner",
        },
      } as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators",
        {
          method: "POST",
          body: JSON.stringify({ userId: "user-to-add" }),
        }
      );
      const response = await addCurator(request, {
        params: Promise.resolve({ organizationId: "org-1", id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Cannot add curators to a bounty that is completed, closed, or cancelled"
      );
    });

    test("should return 400 when bounty is cancelled", async () => {
      // Arrange
      const mockBounty = { id: "bounty-1", status: "CANCELLED" };

      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "admin-user",
        organizationId: "org-1",
        membership: {
          id: "admin-member",
          userId: "admin-user",
          organizationId: "org-1",
          role: "owner",
        },
      } as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators",
        {
          method: "POST",
          body: JSON.stringify({ userId: "user-to-add" }),
        }
      );
      const response = await addCurator(request, {
        params: Promise.resolve({ organizationId: "org-1", id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Cannot add curators to a bounty that is completed, closed, or cancelled"
      );
    });

    test("should return 400 when user is not a member of organization", async () => {
      // Arrange
      const mockBounty = { id: "bounty-1", status: "OPEN" };

      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "admin-user",
        organizationId: "org-1",
        membership: {
          id: "admin-member",
          userId: "admin-user",
          organizationId: "org-1",
          role: "owner",
        },
      } as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);
      vi.mocked(database.member.findUnique).mockResolvedValue(null); // Not a member

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators",
        {
          method: "POST",
          body: JSON.stringify({ userId: "non-member-user" }),
        }
      );
      const response = await addCurator(request, {
        params: Promise.resolve({ organizationId: "org-1", id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("User is not a member of this organization");
    });

    test("should return 400 when user is already a curator", async () => {
      // Arrange
      const mockBounty = { id: "bounty-1", status: "OPEN" };
      const mockMember = {
        id: "member-1",
        userId: "existing-curator",
        organizationId: "org-1",
        user: { email: "existing@example.com" },
      };
      const existingCurator = {
        id: "curator-existing",
        bountyId: "bounty-1",
        userId: "existing-curator",
      };

      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "admin-user",
        organizationId: "org-1",
        membership: {
          id: "admin-member",
          userId: "admin-user",
          organizationId: "org-1",
          role: "owner",
        },
      } as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);
      vi.mocked(database.member.findUnique).mockResolvedValue(
        mockMember as any
      );
      vi.mocked(database.curator.findFirst).mockResolvedValue(
        existingCurator as any
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators",
        {
          method: "POST",
          body: JSON.stringify({ userId: "existing-curator" }),
        }
      );
      const response = await addCurator(request, {
        params: Promise.resolve({ organizationId: "org-1", id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("User is already a curator for this bounty");
    });

    test("should return 400 for invalid input (missing userId)", async () => {
      // Arrange
      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "admin-user",
        organizationId: "org-1",
        membership: {
          id: "admin-member",
          userId: "admin-user",
          organizationId: "org-1",
          role: "owner",
        },
      } as any);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators",
        {
          method: "POST",
          body: JSON.stringify({}), // Missing userId
        }
      );
      const response = await addCurator(request, {
        params: Promise.resolve({ organizationId: "org-1", id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.message).toBeDefined();
      expect(data.details).toBeDefined();
    });

    test("should return 400 for invalid input (empty userId)", async () => {
      // Arrange
      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "admin-user",
        organizationId: "org-1",
        membership: {
          id: "admin-member",
          userId: "admin-user",
          organizationId: "org-1",
          role: "owner",
        },
      } as any);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators",
        {
          method: "POST",
          body: JSON.stringify({ userId: "" }), // Empty userId
        }
      );
      const response = await addCurator(request, {
        params: Promise.resolve({ organizationId: "org-1", id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.message).toBeDefined();
      expect(data.details).toBeDefined();
    });

    test("should handle database errors gracefully", async () => {
      // Arrange
      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "admin-user",
        organizationId: "org-1",
        membership: {
          id: "admin-member",
          userId: "admin-user",
          organizationId: "org-1",
          role: "owner",
        },
      } as any);
      vi.mocked(database.bounty.findFirst).mockRejectedValue(
        new Error("Database error")
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators",
        {
          method: "POST",
          body: JSON.stringify({ userId: "user-to-add" }),
        }
      );
      const response = await addCurator(request, {
        params: Promise.resolve({ organizationId: "org-1", id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to add curator");
    });
  });

  // ==========================================================================
  // DELETE /api/v1/organizations/[organizationId]/bounties/[id]/curators/[curatorId]
  // ==========================================================================
  describe("DELETE /api/v1/organizations/[organizationId]/bounties/[id]/curators/[curatorId]", () => {
    test("should remove a curator successfully as organization owner", async () => {
      // Arrange
      const mockBounty = { id: "bounty-1" };
      const mockCurator = {
        id: "curator-1",
        bountyId: "bounty-1",
        userId: "user-1",
      };

      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "owner-user",
        organizationId: "org-1",
        membership: {
          id: "owner-member",
          userId: "owner-user",
          organizationId: "org-1",
          role: "owner",
        },
      } as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);
      vi.mocked(database.curator.findUnique).mockResolvedValue(
        mockCurator as any
      );
      vi.mocked(database.curator.delete).mockResolvedValue(mockCurator as any);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators/curator-1",
        { method: "DELETE" }
      );
      const response = await removeCurator(request, {
        params: Promise.resolve({
          organizationId: "org-1",
          id: "bounty-1",
          curatorId: "curator-1",
        }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(database.curator.delete).toHaveBeenCalledWith({
        where: { id: "curator-1" },
      });
    });

    test("should remove a curator successfully as organization admin", async () => {
      // Arrange
      const mockBounty = { id: "bounty-1" };
      const mockCurator = {
        id: "curator-1",
        bountyId: "bounty-1",
        userId: "user-1",
      };

      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "admin-user",
        organizationId: "org-1",
        membership: {
          id: "admin-member",
          userId: "admin-user",
          organizationId: "org-1",
          role: "admin",
        },
      } as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);
      vi.mocked(database.curator.findUnique).mockResolvedValue(
        mockCurator as any
      );
      vi.mocked(database.curator.delete).mockResolvedValue(mockCurator as any);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators/curator-1",
        { method: "DELETE" }
      );
      const response = await removeCurator(request, {
        params: Promise.resolve({
          organizationId: "org-1",
          id: "bounty-1",
          curatorId: "curator-1",
        }),
      });

      // Assert
      expect(response.status).toBe(200);
    });

    test("should return 401 for unauthenticated users", async () => {
      // Arrange
      vi.mocked(getOrganizationAuth).mockResolvedValue(null);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators/curator-1",
        { method: "DELETE" }
      );
      const response = await removeCurator(request, {
        params: Promise.resolve({
          organizationId: "org-1",
          id: "bounty-1",
          curatorId: "curator-1",
        }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    test("should return 403 for regular members (not owner/admin)", async () => {
      // Arrange
      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "regular-user",
        organizationId: "org-1",
        membership: {
          id: "member-1",
          userId: "regular-user",
          organizationId: "org-1",
          role: "member",
        },
      } as any);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators/curator-1",
        { method: "DELETE" }
      );
      const response = await removeCurator(request, {
        params: Promise.resolve({
          organizationId: "org-1",
          id: "bounty-1",
          curatorId: "curator-1",
        }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toBe("Only owners and admins can remove curators");
    });

    test("should return 404 for non-existent bounty", async () => {
      // Arrange
      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "owner-user",
        organizationId: "org-1",
        membership: {
          id: "owner-member",
          userId: "owner-user",
          organizationId: "org-1",
          role: "owner",
        },
      } as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(null);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/non-existent/curators/curator-1",
        { method: "DELETE" }
      );
      const response = await removeCurator(request, {
        params: Promise.resolve({
          organizationId: "org-1",
          id: "non-existent",
          curatorId: "curator-1",
        }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Bounty not found");
    });

    test("should return 404 for non-existent curator", async () => {
      // Arrange
      const mockBounty = { id: "bounty-1" };

      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "owner-user",
        organizationId: "org-1",
        membership: {
          id: "owner-member",
          userId: "owner-user",
          organizationId: "org-1",
          role: "owner",
        },
      } as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);
      vi.mocked(database.curator.findUnique).mockResolvedValue(null);

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators/non-existent",
        { method: "DELETE" }
      );
      const response = await removeCurator(request, {
        params: Promise.resolve({
          organizationId: "org-1",
          id: "bounty-1",
          curatorId: "non-existent",
        }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Curator not found");
    });

    test("should return 404 when curator belongs to different bounty", async () => {
      // Arrange
      const mockBounty = { id: "bounty-1" };
      const mockCurator = {
        id: "curator-1",
        bountyId: "different-bounty", // Different bounty
        userId: "user-1",
      };

      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "owner-user",
        organizationId: "org-1",
        membership: {
          id: "owner-member",
          userId: "owner-user",
          organizationId: "org-1",
          role: "owner",
        },
      } as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);
      vi.mocked(database.curator.findUnique).mockResolvedValue(
        mockCurator as any
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators/curator-1",
        { method: "DELETE" }
      );
      const response = await removeCurator(request, {
        params: Promise.resolve({
          organizationId: "org-1",
          id: "bounty-1",
          curatorId: "curator-1",
        }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Curator not found");
      expect(database.curator.delete).not.toHaveBeenCalled();
    });

    test("should handle database errors gracefully", async () => {
      // Arrange
      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "owner-user",
        organizationId: "org-1",
        membership: {
          id: "owner-member",
          userId: "owner-user",
          organizationId: "org-1",
          role: "owner",
        },
      } as any);
      vi.mocked(database.bounty.findFirst).mockRejectedValue(
        new Error("Database error")
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators/curator-1",
        { method: "DELETE" }
      );
      const response = await removeCurator(request, {
        params: Promise.resolve({
          organizationId: "org-1",
          id: "bounty-1",
          curatorId: "curator-1",
        }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to remove curator");
    });

    test("should handle delete operation errors gracefully", async () => {
      // Arrange
      const mockBounty = { id: "bounty-1" };
      const mockCurator = {
        id: "curator-1",
        bountyId: "bounty-1",
        userId: "user-1",
      };

      vi.mocked(getOrganizationAuth).mockResolvedValue({
        userId: "owner-user",
        organizationId: "org-1",
        membership: {
          id: "owner-member",
          userId: "owner-user",
          organizationId: "org-1",
          role: "owner",
        },
      } as any);
      vi.mocked(database.bounty.findFirst).mockResolvedValue(mockBounty as any);
      vi.mocked(database.curator.findUnique).mockResolvedValue(
        mockCurator as any
      );
      vi.mocked(database.curator.delete).mockRejectedValue(
        new Error("Delete failed")
      );

      // Act
      const request = new NextRequest(
        "http://localhost:3002/api/v1/organizations/org-1/bounties/bounty-1/curators/curator-1",
        { method: "DELETE" }
      );
      const response = await removeCurator(request, {
        params: Promise.resolve({
          organizationId: "org-1",
          id: "bounty-1",
          curatorId: "curator-1",
        }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to remove curator");
    });
  });
});
