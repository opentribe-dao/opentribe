import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST as createApplication } from "../app/api/v1/grants/[id]/applications/route";

describe("Grant Application System Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/v1/grants/[id]/applications", () => {
    test("should create an application for authenticated user", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "applicant@example.com",
          username: "applicant",
        },
      };

      const mockGrant = {
        id: "grant-1",
        title: "Test Grant",
        status: "OPEN",
        visibility: "PUBLISHED",
        source: "NATIVE",
        screening: [],
        organizationId: "org-1",
        minAmount: 1000,
        maxAmount: 10000,
      };

      const mockApplication = {
        id: "application-1",
        grantId: "grant-1",
        userId: "user-123",
        title: "My Application",
        description: "Application description",
        budget: 5000,
        status: "SUBMITTED",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.grant.findUnique as any).mockResolvedValue(mockGrant);
      (database.grantApplication.findFirst as any).mockResolvedValue(null);
      (database.member.findMany as any).mockResolvedValue([]);
      (database.grantApplication.create as any).mockResolvedValue(
        mockApplication
      );

      // Act
      const body = JSON.stringify({
        title: "My Application",
        description: "Application description",
        budget: 5000,
      });

      const request = new Request(
        "http://localhost:3002/api/v1/grants/grant-1/applications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createApplication(request, {
        params: Promise.resolve({ id: "grant-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.application.id).toBe("application-1");
      expect(data.application.title).toBe("My Application");
      expect(database.grantApplication.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            grantId: "grant-1",
            userId: "user-123",
            title: "My Application",
            description: "Application description",
            budget: 5000,
            status: "SUBMITTED",
          }),
        })
      );
    });

    test("should reject application if user not authenticated", async () => {
      // Arrange
      (auth.api.getSession as any).mockResolvedValue(null);

      // Act
      const body = JSON.stringify({
        title: "My Application",
        description: "Application description",
      });

      const request = new Request(
        "http://localhost:3002/api/v1/grants/grant-1/applications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createApplication(request, {
        params: Promise.resolve({ id: "grant-1" }),
      });

      // Assert
      expect(response.status).toBe(401);
      expect(database.grantApplication.create).not.toHaveBeenCalled();
    });

    test("should reject application for closed grant", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "applicant@example.com",
        },
      };

      const mockGrant = {
        id: "grant-1",
        status: "CLOSED",
        visibility: "PUBLISHED",
        source: "NATIVE",
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.grant.findUnique as any).mockResolvedValue(mockGrant);

      // Act
      const body = JSON.stringify({
        title: "My Application",
        description: "Application description",
      });

      const request = new Request(
        "http://localhost:3002/api/v1/grants/grant-1/applications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createApplication(request, {
        params: Promise.resolve({ id: "grant-1" }),
      });

      // Assert
      expect(response.status).toBe(400);
      expect(database.grantApplication.create).not.toHaveBeenCalled();
    });

    test("should reject application from organization members", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "member-123",
          email: "member@org.com",
        },
      };

      const mockGrant = {
        id: "grant-1",
        title: "Test Grant",
        status: "OPEN",
        visibility: "PUBLISHED",
        source: "NATIVE",
        screening: [],
        organizationId: "org-1",
        minAmount: 1000,
        maxAmount: 10000,
      };

      const mockMembership = [
        {
          id: "membership-1",
          userId: "member-123",
          organizationId: "org-1",
          role: "member",
        },
      ];

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.grant.findUnique as any).mockResolvedValue(mockGrant);
      (database.grantApplication.findFirst as any).mockResolvedValue(null);
      (database.member.findMany as any).mockResolvedValue(mockMembership);

      // Act
      const body = JSON.stringify({
        title: "My Application",
        description: "Application description",
        budget: 5000,
      });

      const request = new Request(
        "http://localhost:3002/api/v1/grants/grant-1/applications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createApplication(request, {
        params: Promise.resolve({ id: "grant-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Members of the same organization cannot apply to the same grant"
      );
      expect(database.member.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: "org-1",
          userId: "member-123",
        },
      });
      expect(database.grantApplication.create).not.toHaveBeenCalled();
    });

    test("should reject duplicate application from same user", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "applicant@example.com",
        },
      };

      const mockGrant = {
        id: "grant-1",
        title: "Test Grant",
        status: "OPEN",
        visibility: "PUBLISHED",
        source: "NATIVE",
      };

      const mockExistingApplication = {
        id: "existing-app-1",
        grantId: "grant-1",
        userId: "user-123",
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.grant.findUnique as any).mockResolvedValue(mockGrant);
      (database.grantApplication.findFirst as any).mockResolvedValue(
        mockExistingApplication
      );

      // Act
      const body = JSON.stringify({
        title: "My Second Application",
        description: "Application description",
      });

      const request = new Request(
        "http://localhost:3002/api/v1/grants/grant-1/applications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createApplication(request, {
        params: Promise.resolve({ id: "grant-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("You have already applied to this grant");
      expect(database.grantApplication.create).not.toHaveBeenCalled();
    });

    test("should reject application for external grant", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "applicant@example.com",
        },
      };

      const mockGrant = {
        id: "grant-1",
        status: "OPEN",
        visibility: "PUBLISHED",
        source: "EXTERNAL",
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.grant.findUnique as any).mockResolvedValue(mockGrant);

      // Act
      const body = JSON.stringify({
        title: "My Application",
        description: "Application description",
      });

      const request = new Request(
        "http://localhost:3002/api/v1/grants/grant-1/applications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createApplication(request, {
        params: Promise.resolve({ id: "grant-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("This grant uses external applications");
      expect(database.grantApplication.create).not.toHaveBeenCalled();
    });
  });
});
