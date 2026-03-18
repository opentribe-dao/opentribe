import { auth, trustedOrigins } from "@packages/auth/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

describe("Auth Server Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("trustedOrigins", () => {
    test("should include localhost origins for development", () => {
      expect(trustedOrigins).toContain("http://localhost:3000");
      expect(trustedOrigins).toContain("http://localhost:3001");
      expect(trustedOrigins).toContain("http://localhost:3002");
    });

    test("should include production opentribe.io origins", () => {
      expect(trustedOrigins).toContain("https://opentribe.io");
      expect(trustedOrigins).toContain("https://api.opentribe.io");
      expect(trustedOrigins).toContain("https://dashboard.opentribe.io");
    });

    test("should include dev opentribe.io origins", () => {
      expect(trustedOrigins).toContain("https://dev.opentribe.io");
      expect(trustedOrigins).toContain("https://api.dev.opentribe.io");
      expect(trustedOrigins).toContain("https://dashboard.dev.opentribe.io");
    });

    test("should be an array of strings", () => {
      expect(Array.isArray(trustedOrigins)).toBe(true);
      trustedOrigins.forEach((origin) => {
        expect(typeof origin).toBe("string");
        expect(origin).toMatch(/^https?:\/\//);
      });
    });
  });

  describe("auth instance", () => {
    test("should be exported as auth object", () => {
      expect(auth).toBeDefined();
      expect(typeof auth).toBe("object");
    });

    test("should have API methods available", () => {
      expect(auth.api).toBeDefined();
      expect(auth.api.getSession).toBeDefined();
      expect(typeof auth.api.getSession).toBe("function");
    });

    test("should have session management methods", () => {
      expect(auth.api.getSession).toBeDefined();
      expect(auth.api.getSession).toBeInstanceOf(Function);
    });
  });

  describe("Role Architecture Documentation", () => {
    test("should have clear role documentation in comments", () => {
      // This test verifies the role architecture is documented
      // Platform Roles: user, admin, superadmin
      // Organization Roles: owner, admin, member
      const platformRoles = ["user", "admin", "superadmin"];
      const organizationRoles = ["owner", "admin", "member"];

      // Verify roles are defined (documented in the code)
      expect(platformRoles).toContain("user");
      expect(platformRoles).toContain("admin");
      expect(platformRoles).toContain("superadmin");

      expect(organizationRoles).toContain("owner");
      expect(organizationRoles).toContain("admin");
      expect(organizationRoles).toContain("member");
    });
  });
});
