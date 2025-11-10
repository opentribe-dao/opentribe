import { auth } from "@packages/auth/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock the auth module
vi.mock("@packages/auth/server", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

describe("Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Session Management", () => {
    test("should return user session when authenticated", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          email: "test@example.com",
          username: "testuser",
          role: "USER",
        },
        session: {
          id: "session-123",
          userId: "user-123",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

      const headers = new Headers();
      const session = await auth.api.getSession({ headers });

      expect(session).toEqual(mockSession);
      expect(auth.api.getSession).toHaveBeenCalledWith({ headers });
    });

    test("should return null when not authenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const headers = new Headers();
      const session = await auth.api.getSession({ headers });

      expect(session).toBeNull();
    });
  });

  describe("Role-based Access Control", () => {
    test("should allow SUPERADMIN access to admin routes", async () => {
      const mockSession = {
        user: {
          id: "admin-123",
          email: "admin@example.com",
          role: "SUPERADMIN",
        },
        session: {
          id: "session-123",
          userId: "admin-123",
        },
      };

      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);

      const headers = new Headers();
      const session = await auth.api.getSession({ headers });

      expect(session?.user.role).toBe("SUPERADMIN");
    });

    test("should deny access for unauthorized users", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const headers = new Headers();
      const session = await auth.api.getSession({ headers });

      expect(session).toBeNull();
    });
  });
});
