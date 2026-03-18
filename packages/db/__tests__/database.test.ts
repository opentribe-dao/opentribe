import { database } from "@packages/db";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Import the mock setup to ensure database is properly mocked
vi.mock("@packages/db/__mocks__/index");

describe("Database Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("database export", () => {
    test("should be defined and exported", () => {
      expect(database).toBeDefined();
    });

    test("should be a mock of PrismaClient", () => {
      expect(database).toBeDefined();
      // The database is a deep mock, so it should have Prisma model accessors
      expect(database).toHaveProperty("user");
      expect(database).toHaveProperty("session");
    });
  });

  describe("Prisma models", () => {
    test("should have user model", () => {
      expect(database.user).toBeDefined();
    });

    test("should have session model", () => {
      expect(database.session).toBeDefined();
    });

    test("should have account model", () => {
      expect(database.account).toBeDefined();
    });

    test("should have verification model", () => {
      expect(database.verification).toBeDefined();
    });

    test("should have organization model", () => {
      expect(database.organization).toBeDefined();
    });

    test("should have member model", () => {
      expect(database.member).toBeDefined();
    });

    test("should have bounty model", () => {
      expect(database.bounty).toBeDefined();
    });

    test("should have submission model", () => {
      expect(database.submission).toBeDefined();
    });
  });

  describe("mock behavior", () => {
    test("should allow mocking findUnique", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
      };

      vi.mocked(database.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await database.user.findUnique({
        where: { id: "user-123" },
      });

      expect(result).toEqual(mockUser);
      expect(database.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
      });
    });

    test("should allow mocking findMany", async () => {
      const mockUsers = [
        { id: "user-1", email: "user1@example.com" },
        { id: "user-2", email: "user2@example.com" },
      ];

      vi.mocked(database.user.findMany).mockResolvedValue(mockUsers as any);

      const result = await database.user.findMany({
        where: { email: { contains: "@example.com" } },
      });

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockUsers);
    });

    test("should allow mocking create", async () => {
      const newUser = {
        id: "new-user-id",
        email: "new@example.com",
        name: "New User",
      };

      vi.mocked(database.user.create).mockResolvedValue(newUser as any);

      const result = await database.user.create({
        data: {
          email: "new@example.com",
          name: "New User",
        },
      });

      expect(result.id).toBe("new-user-id");
    });

    test("should allow mocking update", async () => {
      const updatedUser = {
        id: "user-123",
        email: "updated@example.com",
        name: "Updated User",
      };

      vi.mocked(database.user.update).mockResolvedValue(updatedUser as any);

      const result = await database.user.update({
        where: { id: "user-123" },
        data: { name: "Updated User" },
      });

      expect(result.name).toBe("Updated User");
    });

    test("should allow mocking delete", async () => {
      vi.mocked(database.user.delete).mockResolvedValue({} as any);

      await expect(
        database.user.delete({
          where: { id: "user-123" },
        })
      ).resolves.toBeDefined();
    });

    test("should allow mocking count", async () => {
      vi.mocked(database.user.count).mockResolvedValue(42);

      const count = await database.user.count();

      expect(count).toBe(42);
    });
  });

  describe("relation queries", () => {
    test("should support include for relations", async () => {
      const mockUserWithSessions = {
        id: "user-123",
        email: "test@example.com",
        sessions: [
          { id: "session-1", userId: "user-123" },
          { id: "session-2", userId: "user-123" },
        ],
      };

      vi.mocked(database.user.findUnique).mockResolvedValue(
        mockUserWithSessions as any
      );

      const result = await database.user.findUnique({
        where: { id: "user-123" },
        include: { sessions: true },
      });

      expect(result?.sessions).toHaveLength(2);
    });

    test("should support nested includes", async () => {
      const mockBountyWithSubmissions = {
        id: "bounty-123",
        title: "Test Bounty",
        submissions: [
          {
            id: "sub-1",
            bountyId: "bounty-123",
            submitter: {
              id: "user-123",
              email: "test@example.com",
            },
          },
        ],
      };

      vi.mocked(database.bounty.findUnique).mockResolvedValue(
        mockBountyWithSubmissions as any
      );

      const result = await database.bounty.findUnique({
        where: { id: "bounty-123" },
        include: {
          submissions: {
            include: { submitter: true },
          },
        },
      });

      expect(result?.submissions[0].submitter.email).toBe("test@example.com");
    });
  });
});
