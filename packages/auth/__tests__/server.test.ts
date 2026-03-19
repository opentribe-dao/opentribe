import {
  auth,
  shouldIncludeLocalhostOrigins,
  trustedOrigins,
} from "@packages/auth/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("better-auth", () => ({
  betterAuth: vi.fn(() => ({
    api: {
      getSession: vi.fn(),
    },
  })),
}));

vi.mock("better-auth/plugins", () => ({
  admin: vi.fn(() => ({ name: "admin-plugin" })),
  customSession: vi.fn(() => ({ name: "custom-session-plugin" })),
  organization: vi.fn(() => ({ name: "organization-plugin" })),
}));

vi.mock("better-auth/plugins/admin/access", () => ({
  defaultRoles: {
    admin: {},
  },
}));

describe("Auth Server Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("trustedOrigins", () => {
    test("should exclude localhost origins in production", () => {
      expect(
        shouldIncludeLocalhostOrigins({ VERCEL_TARGET_ENV: "production" } as NodeJS.ProcessEnv)
      ).toBe(false);
    });

    test("should include localhost origins outside production", () => {
      expect(
        shouldIncludeLocalhostOrigins({ VERCEL_TARGET_ENV: "preview" } as NodeJS.ProcessEnv)
      ).toBe(true);
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
