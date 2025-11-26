import { auth } from "@packages/auth/server";
import { database } from "@packages/db";
import { sendBountyFirstSubmissionEmail } from "@packages/email";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST as createSubmission } from "../app/api/v1/bounties/[id]/submissions/route";
import { POST as announceWinners } from "../app/api/v1/bounties/[id]/winners/route";

vi.mock("@packages/email", () => ({
  sendBountyFirstSubmissionEmail: vi.fn(),
}));

describe("Submission System Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSubmissionAuth).mockReset();
  });

  describe("POST /api/v1/bounties/[id]/submissions", () => {
    test("should create a submission for authenticated user", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "submitter@example.com",
          username: "submitter",
        },
      };

      const mockUser = {
        id: "user-123",
        profileCompleted: true,
      };

      const mockBounty = {
        id: "bounty-1",
        slug: "bounty-1",
        title: "Test Bounty",
        status: "OPEN",
        deadline: new Date("2025-12-31"),
        visibility: "PUBLISHED",
      };

      const mockSubmission = {
        id: "submission-1",
        bountyId: "bounty-1",
        bountySlug: "bounty-1",
        submitterId: "user-123",
        title: "My Submission",
        description: "Submission description",
        submissionUrl: "https://github.com/user/repo",
        attachments: [],
        responses: {},
        isWinner: false,
        position: null,
        winningAmount: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.user.findUnique as any).mockResolvedValue(mockUser);
      (database.bounty.findFirst as any).mockResolvedValue(mockBounty);
      (database.submission.findFirst as any).mockResolvedValue(null);
      (database.submission.create as any).mockResolvedValue(mockSubmission);
      (database.member.findMany as any).mockResolvedValue([]);

      // Act
      const body = JSON.stringify({
        submissionUrl: "https://github.com/user/repo",
        title: "My Submission",
        description: "Submission description",
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createSubmission(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.submission.id).toBe("submission-1");
      expect(data.submission.title).toBe("My Submission");
      expect(database.submission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bountyId: "bounty-1",
            userId: "user-123",
            submissionUrl: "https://github.com/user/repo",
            title: "My Submission",
            description: "Submission description",
            status: "SUBMITTED",
          }),
          include: expect.any(Object),
        })
      );
    });

    test("should reject submission if user not authenticated", async () => {
      // Arrange
      (auth.api.getSession as any).mockResolvedValue(null);

      // Act
      const body = JSON.stringify({
        submissionUrl: "https://github.com/user/repo",
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createSubmission(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });

      // Assert
      expect(response.status).toBe(401);
      expect(database.submission.create).not.toHaveBeenCalled();
    });

    test("should reject submission for closed bounty", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "user-123",
          email: "submitter@example.com",
        },
      };

      const mockBounty = {
        id: "bounty-1",
        status: "CLOSED",
        visibility: "PUBLIC",
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findFirst as any).mockResolvedValue(mockBounty);

      // Act
      const body = JSON.stringify({
        submissionUrl: "https://github.com/user/repo",
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createSubmission(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });

      // Assert
      expect(response.status).toBe(400);
      expect(database.submission.create).not.toHaveBeenCalled();
    });

    test("should reject submission from organization members", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "member-123",
          email: "member@org.com",
        },
      };

      const mockUser = {
        id: "member-123",
        profileCompleted: true,
      };

      const mockBounty = {
        id: "bounty-1",
        slug: "bounty-1",
        title: "Test Bounty",
        status: "OPEN",
        visibility: "PUBLISHED",
        organizationId: "org-1",
        deadline: new Date("2025-12-31"),
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
      (database.user.findUnique as any).mockResolvedValue(mockUser);
      (database.bounty.findFirst as any).mockResolvedValue(mockBounty);
      (database.submission.findFirst as any).mockResolvedValue(null);
      (database.member.findMany as any).mockResolvedValue(mockMembership);

      // Act
      const body = JSON.stringify({
        submissionUrl: "https://github.com/user/repo",
        title: "My Submission",
        description: "Submission description",
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/submissions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createSubmission(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Members of the same organization cannot submit to the same bounty"
      );
      expect(database.member.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: "org-1",
          userId: "member-123",
        },
      });
      expect(database.submission.create).not.toHaveBeenCalled();
    });

    test("should reject submission when required screening answers are missing", async () => {
      const mockSession = {
        user: {
          id: "user-abc",
          email: "user@example.com",
        },
      };

      const mockUser = {
        id: "user-abc",
        profileCompleted: true,
      };

      const mockBounty = {
        id: "bounty-req",
        slug: "bounty-req",
        title: "Screened Bounty",
        status: "OPEN",
        visibility: "PUBLISHED",
        organizationId: "org-screen",
        screening: [
          {
            question: "Are you available full-time?",
            type: "boolean",
            optional: false,
          },
        ],
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.user.findUnique as any).mockResolvedValue(mockUser);
      (database.bounty.findFirst as any).mockResolvedValue(mockBounty);
      (database.submission.findFirst as any).mockResolvedValue(null);
      (database.member.findMany as any).mockResolvedValue([]);

      const body = JSON.stringify({
        submissionUrl: "https://github.com/user/repo",
        title: "My Submission",
        description: "Submission description",
        responses: {},
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-req/submissions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createSubmission(request, {
        params: Promise.resolve({ id: "bounty-req" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Missing response for required question");
      expect(database.submission.create).not.toHaveBeenCalled();
    });

    test("should normalize boolean screening responses before saving", async () => {
      const mockSession = {
        user: {
          id: "user-bool",
          email: "bool@example.com",
          username: "bool-user",
        },
      };

      const mockUser = {
        id: "user-bool",
        profileCompleted: true,
      };

      const mockBounty = {
        id: "bounty-bool",
        slug: "bounty-bool",
        title: "Boolean Screening",
        status: "OPEN",
        visibility: "PUBLISHED",
        organizationId: "org-bool",
        screening: [
          {
            question: "Can you commit 10 hours per week?",
            type: "boolean",
            optional: false,
          },
        ],
      };

      const mockSubmission = {
        id: "submission-bool",
        bountyId: "bounty-bool",
        userId: "user-bool",
        title: "My Submission",
        description: "Submission description",
        submissionUrl: "https://github.com/user/repo",
        responses: {
          "Can you commit 10 hours per week?": true,
        },
        status: "SUBMITTED",
        submittedAt: new Date(),
        submitter: {
          id: "user-bool",
          username: "bool-user",
          firstName: "Bool",
          lastName: "User",
          image: null,
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.user.findUnique as any).mockResolvedValue(mockUser);
      (database.bounty.findFirst as any).mockResolvedValue(mockBounty);
      (database.submission.findFirst as any).mockResolvedValue(null);
      (database.member.findMany as any).mockResolvedValue([]);
      (database.submission.create as any).mockResolvedValue(mockSubmission);
      (database.bounty.update as any).mockResolvedValue({});
      (database.submission.count as any).mockResolvedValue(2);

      const body = JSON.stringify({
        submissionUrl: "https://github.com/user/repo",
        title: "My Submission",
        description: "Submission description",
        responses: {
          "Can you commit 10 hours per week?": "Yes",
        },
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-bool/submissions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createSubmission(request, {
        params: Promise.resolve({ id: "bounty-bool" }),
      });

      expect(response.status).toBe(201);
      expect(database.submission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            responses: {
              "Can you commit 10 hours per week?": true,
            },
          }),
        })
      );
    });

    test("should persist attachments separately from screening responses", async () => {
      const mockSession = {
        user: {
          id: "user-files",
          email: "files@example.com",
        },
      };

      const mockUser = {
        id: "user-files",
        profileCompleted: true,
      };

      const mockBounty = {
        id: "bounty-files",
        slug: "bounty-files",
        title: "Files Bounty",
        status: "OPEN",
        visibility: "PUBLISHED",
        organizationId: "org-files",
        screening: [
          {
            question: "Share context",
            type: "text",
            optional: false,
          },
        ],
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.user.findUnique as any).mockResolvedValue(mockUser);
      (database.bounty.findFirst as any).mockResolvedValue(mockBounty);
      (database.submission.findFirst as any).mockResolvedValue(null);
      (database.member.findMany as any).mockResolvedValue([]);
      const mockCreatedSubmission = {
        id: "submission-files",
        title: "My Submission",
        description: "Submission description",
        submitter: {
          firstName: "Files",
          username: "files-user",
        },
      };
      (database.submission.create as any).mockResolvedValue(
        mockCreatedSubmission
      );
      (database.bounty.update as any).mockResolvedValue({});
      (database.submission.count as any).mockResolvedValue(1);
      (database.curator.findMany as any).mockResolvedValue([
        {
          user: {
            email: "curator@org.com",
            firstName: "Curator",
            username: "curator",
          },
        },
      ]);
      vi.mocked(sendBountyFirstSubmissionEmail).mockResolvedValue(
        undefined as any
      );

      const attachments = [
        "https://files.opentribe.io/submission-1.pdf",
        "https://files.opentribe.io/demo.mp4",
      ];

      const body = JSON.stringify({
        submissionUrl: "https://github.com/user/repo",
        title: "My Submission",
        description: "Submission description",
        responses: {
          "Share context": "Here is what we built",
        },
        attachments,
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-files/submissions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await createSubmission(request, {
        params: Promise.resolve({ id: "bounty-files" }),
      });

      expect(response.status).toBe(201);
      expect(database.submission.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            attachments,
            responses: {
              "Share context": "Here is what we built",
            },
          }),
        })
      );
      expect(database.curator.findMany).toHaveBeenCalledWith({
        where: { bountyId: "bounty-files" },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              username: true,
            },
          },
        },
      });
      expect(sendBountyFirstSubmissionEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /api/v1/bounties/[id]/winners", () => {
    test("should announce winners for organization owner", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "org-admin",
          email: "admin@org.com",
        },
      };

      const mockBounty = {
        id: "bounty-1",
        organizationId: "org-1",
        winnersAnnouncedAt: null,
        status: "OPEN",
        token: "USDT",
        winnings: { "1": 500, "2": 300, "3": 200 },
        organization: {
          id: "org-1",
          members: [
            {
              userId: "org-admin",
              role: "OWNER",
            },
          ],
        },
      };

      const mockUpdatedBounty = {
        ...mockBounty,
        winnersAnnouncedAt: new Date(),
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);
      (database.submission.findMany as any).mockResolvedValue([
        { id: "sub-1", userId: "u1", status: "SUBMITTED" },
        { id: "sub-2", userId: "u2", status: "SUBMITTED" },
        { id: "sub-3", userId: "u3", status: "SUBMITTED" },
      ]);
      // Simulate transaction outcome with winners and updated bounty
      (database.$transaction as any) = vi.fn(async (fn: any) => ({
        ...mockUpdatedBounty,
        status: "COMPLETED",
        submissions: [
          {
            id: "sub-1",
            position: 1,
            winningAmount: 500,
            submitter: { email: "a@b.com", username: "u1" },
          },
          {
            id: "sub-2",
            position: 2,
            winningAmount: 300,
            submitter: { email: "c@d.com", username: "u2" },
          },
          {
            id: "sub-3",
            position: 3,
            winningAmount: 200,
            submitter: { email: "e@f.com", username: "u3" },
          },
        ],
        organization: { name: "Org" },
      }));

      // Act
      const body = JSON.stringify({
        winners: [
          { submissionId: "sub-1", position: 1, amount: 500 },
          { submissionId: "sub-2", position: 2, amount: 300 },
          { submissionId: "sub-3", position: 3, amount: 200 },
        ],
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/winners",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await announceWinners(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe("Winners announced successfully");
      // Assert
    });

    test("should prevent non-members from announcing winners", async () => {
      // Arrange
      const mockSession = {
        user: {
          id: "non-member",
          email: "user@example.com",
        },
      };

      const mockBounty = {
        id: "bounty-1",
        organizationId: "org-1",
        organization: {
          id: "org-1",
          members: [], // User not in members
        },
      };

      (auth.api.getSession as any).mockResolvedValue(mockSession);
      (database.bounty.findUnique as any).mockResolvedValue(mockBounty);

      // Act
      const body = JSON.stringify({
        winners: [{ submissionId: "sub-1", position: 1, amount: 500 }],
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-1/winners",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await announceWinners(request, {
        params: Promise.resolve({ id: "bounty-1" }),
      });

      // Assert
      expect(response.status).toBe(403);
      expect(database.submission.updateMany).not.toHaveBeenCalled();
      expect(database.bounty.update).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/bounties/[id]/submissions/me", () => {
    test("should return user's submission when authenticated", async () => {
      const mockSession = {
        user: {
          id: "user-me",
          email: "me@example.com",
        },
      };

      const mockBounty = {
        id: "bounty-me",
      };

      const mockSubmission = {
        id: "submission-me",
        bountyId: "bounty-me",
        userId: "user-me",
        title: "My Submission",
        description: "Description",
        submissionUrl: "https://github.com/user/repo",
        attachments: [],
        responses: {},
        status: "SUBMITTED",
        submitter: {
          id: "user-me",
          username: "me",
          firstName: "Test",
          lastName: "User",
          image: null,
        },
      };

      vi.mocked(getSubmissionAuth).mockResolvedValueOnce({
        userId: "user-me",
        bountyId: "bounty-me",
        submissionId: "submission-me",
      });

      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-me/submissions/me"
      );

      const response = await getMySubmission(request, {
        params: Promise.resolve({ id: "bounty-me" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.submission.id).toBe("submission-me");
    });

    test("should return 401 when not authenticated", async () => {
      vi.mocked(getSubmissionAuth).mockResolvedValueOnce({
        error: "Unauthorized",
        status: 401,
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-me/submissions/me"
      );

      const response = await getMySubmission(request, {
        params: Promise.resolve({ id: "bounty-me" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    test("should return 404 when no submission exists", async () => {
      vi.mocked(getSubmissionAuth).mockResolvedValueOnce({
        error: "No submission found",
        status: 404,
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-me/submissions/me"
      );

      const response = await getMySubmission(request, {
        params: Promise.resolve({ id: "bounty-me" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("No submission found");
    });

    test("should return 404 when bounty doesn't exist", async () => {
      vi.mocked(getSubmissionAuth).mockResolvedValueOnce({
        error: "Bounty not found",
        status: 404,
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-me/submissions/me"
      );

      const response = await getMySubmission(request, {
        params: Promise.resolve({ id: "bounty-me" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Bounty not found");
    });
  });

  describe("PATCH /api/v1/bounties/[id]/submissions/me", () => {
    test("should update submission when user owns it", async () => {
      const mockSubmission = {
        id: "submission-update",
        bountyId: "bounty-update",
        userId: "user-update",
        isWinner: false,
        bounty: {
          status: "OPEN",
          deadline: new Date("2025-12-31"),
        },
      };

      const updatedSubmission = {
        ...mockSubmission,
        title: "Updated Title",
        description: "Updated description",
      };

      vi.mocked(getSubmissionAuth).mockResolvedValueOnce({
        userId: "user-update",
        bountyId: "bounty-update",
        submissionId: "submission-update",
      });

      (database.submission.findUnique as any)
        .mockResolvedValueOnce(mockSubmission)
        .mockResolvedValueOnce(updatedSubmission);
      (database.submission.update as any).mockResolvedValue(updatedSubmission);

      const body = JSON.stringify({
        title: "Updated Title",
        description: "Updated description",
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-update/submissions/me",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await updateMySubmission(request, {
        params: Promise.resolve({ id: "bounty-update" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Submission updated successfully");
      expect(data.submission.title).toBe("Updated Title");
    });

    test("should return 400 when trying to edit winning submission", async () => {
      const mockSubmission = {
        id: "submission-winner",
        isWinner: true,
        bounty: {
          status: "OPEN",
          deadline: new Date("2025-12-31"),
        },
      };

      vi.mocked(getSubmissionAuth).mockResolvedValueOnce({
        userId: "user-winner",
        bountyId: "bounty-winner",
        submissionId: "submission-winner",
      });

      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);

      const body = JSON.stringify({
        title: "Updated Title",
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-winner/submissions/me",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await updateMySubmission(request, {
        params: Promise.resolve({ id: "bounty-winner" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Cannot edit a winning submission");
    });

    test("should return 400 when validation fails", async () => {
      vi.mocked(getSubmissionAuth).mockResolvedValueOnce({
        userId: "user-validate",
        bountyId: "bounty-validate",
        submissionId: "submission-validate",
      });

      const mockSubmission = {
        id: "submission-validate",
        isWinner: false,
        bounty: {
          status: "OPEN",
          deadline: new Date("2025-12-31"),
        },
      };

      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);

      const body = JSON.stringify({
        submissionUrl: "invalid-url",
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-validate/submissions/me",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body,
        }
      );

      const response = await updateMySubmission(request, {
        params: Promise.resolve({ id: "bounty-validate" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.message).toContain("Invalid URL format");
    });
  });

  describe("DELETE /api/v1/bounties/[id]/submissions/me", () => {
    test("should delete submission when user owns it", async () => {
      const mockSubmission = {
        id: "submission-delete",
        isWinner: false,
        bounty: {
          status: "OPEN",
          deadline: new Date("2025-12-31"),
        },
      };

      vi.mocked(getSubmissionAuth).mockResolvedValueOnce({
        userId: "user-delete",
        bountyId: "bounty-delete",
        submissionId: "submission-delete",
      });

      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);
      (database.submission.delete as any).mockResolvedValue({});
      (database.bounty.update as any).mockResolvedValue({});

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-delete/submissions/me",
        {
          method: "DELETE",
        }
      );

      const response = await deleteMySubmission(request, {
        params: Promise.resolve({ id: "bounty-delete" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Submission deleted successfully");
      expect(database.submission.delete).toHaveBeenCalled();
      expect(database.bounty.update).toHaveBeenCalled();
    });

    test("should return 400 when trying to delete winning submission", async () => {
      const mockSubmission = {
        id: "submission-winner-delete",
        isWinner: true,
        bounty: {
          status: "OPEN",
          deadline: new Date("2025-12-31"),
        },
      };

      vi.mocked(getSubmissionAuth).mockResolvedValueOnce({
        userId: "user-winner-delete",
        bountyId: "bounty-winner-delete",
        submissionId: "submission-winner-delete",
      });

      (database.submission.findUnique as any).mockResolvedValue(mockSubmission);

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-winner-delete/submissions/me",
        {
          method: "DELETE",
        }
      );

      const response = await deleteMySubmission(request, {
        params: Promise.resolve({ id: "bounty-winner-delete" }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Cannot delete a winning submission");
      expect(database.submission.delete).not.toHaveBeenCalled();
    });

    test("should return 401 when not authenticated", async () => {
      vi.mocked(getSubmissionAuth).mockResolvedValueOnce({
        error: "Unauthorized",
        status: 401,
      });

      const request = new Request(
        "http://localhost:3002/api/v1/bounties/bounty-delete/submissions/me",
        {
          method: "DELETE",
        }
      );

      const response = await deleteMySubmission(request, {
        params: Promise.resolve({ id: "bounty-delete" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });
});
