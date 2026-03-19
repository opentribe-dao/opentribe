import {
  BASE_URL,
  DASHBOARD_URL,
  FROM_EMAIL,
  sendBountyDeadlineReminderEmail,
  sendBountyFirstSubmissionEmail,
  sendBountyWinnerEmail,
  sendBountyWinnerReminderEmail,
  sendCommentReplyEmail,
  sendGrantFirstApplicationEmail,
  sendGrantStatusUpdateEmail,
  sendOnboardingCompleteEmail,
  sendOrgInviteEmail,
  sendPasswordResetEmail,
  sendPaymentConfirmationEmail,
  sendSkillMatchBountyEmail,
  sendVerificationEmail,
  sendWeeklyDigestEmail,
  sendWelcomeEmail,
} from "@packages/email/services/email-service";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock resend
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({
        data: { id: "test-email-id" },
        error: null,
      }),
    },
  })),
}));

// Mock react-email templates to avoid render issues in tests
vi.mock("../templates", () => ({
  VerificationEmail: vi.fn(() => ({ type: "VerificationEmail" })),
  WelcomeEmail: vi.fn(() => ({ type: "WelcomeEmail" })),
  PasswordResetEmail: vi.fn(() => ({ type: "PasswordResetEmail" })),
  OnboardingCompleteEmail: vi.fn(() => ({ type: "OnboardingCompleteEmail" })),
  OrgInviteEmail: vi.fn(() => ({ type: "OrgInviteEmail" })),
  BountyFirstSubmissionEmail: vi.fn(() => ({
    type: "BountyFirstSubmissionEmail",
  })),
  BountyDeadlineReminderEmail: vi.fn(() => ({
    type: "BountyDeadlineReminderEmail",
  })),
  BountyWinnerReminderEmail: vi.fn(() => ({
    type: "BountyWinnerReminderEmail",
  })),
  BountyWinnerEmail: vi.fn(() => ({ type: "BountyWinnerEmail" })),
  GrantFirstApplicationEmail: vi.fn(() => ({
    type: "GrantFirstApplicationEmail",
  })),
  GrantStatusUpdateEmail: vi.fn(() => ({ type: "GrantStatusUpdateEmail" })),
  CommentReplyEmail: vi.fn(() => ({ type: "CommentReplyEmail" })),
  WeeklyDigestEmail: vi.fn(() => ({ type: "WeeklyDigestEmail" })),
  BountySkillMatchEmail: vi.fn(() => ({ type: "BountySkillMatchEmail" })),
  PaymentConfirmationEmail: vi.fn(() => ({ type: "PaymentConfirmationEmail" })),
}));

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("constants", () => {
    test("should export FROM_EMAIL with proper format", () => {
      expect(FROM_EMAIL).toContain("Opentribe");
    });

    test("should export BASE_URL", () => {
      expect(BASE_URL).toBe("http://localhost:3000");
    });

    test("should export DASHBOARD_URL", () => {
      expect(DASHBOARD_URL).toBe("http://localhost:3001");
    });
  });

  describe("Authentication & Onboarding Emails", () => {
    describe("sendVerificationEmail", () => {
      test("should send verification email", async () => {
        const user = { email: "test@example.com", firstName: "Test" };
        const token = "verification-token-123";

        const result = await sendVerificationEmail(user, token);

        expect(result).toBeDefined();
        expect(result).toHaveProperty("data");
        expect(result.data?.id).toBe("test-email-id");
      });

      test("should accept optional verification code", async () => {
        const user = { email: "test@example.com", firstName: "Test" };
        const token = "verification-token-123";
        const code = "123456";

        const result = await sendVerificationEmail(user, token, code);

        expect(result).toBeDefined();
      });

      test("should handle user without firstName", async () => {
        const user = { email: "test@example.com" };
        const token = "verification-token-123";

        const result = await sendVerificationEmail(user, token);

        expect(result).toBeDefined();
      });
    });

    describe("sendWelcomeEmail", () => {
      test("should send welcome email", async () => {
        const user = { email: "newuser@example.com", firstName: "New" };

        const result = await sendWelcomeEmail(user);

        expect(result).toBeDefined();
        expect(result).toHaveProperty("data");
      });
    });

    describe("sendPasswordResetEmail", () => {
      test("should send password reset email", async () => {
        const user = { email: "user@example.com", firstName: "User" };
        const resetToken = "reset-token-123";

        const result = await sendPasswordResetEmail(user, resetToken);

        expect(result).toBeDefined();
      });
    });

    describe("sendOnboardingCompleteEmail", () => {
      test("should send onboarding complete email for builder", async () => {
        const user = {
          email: "builder@example.com",
          firstName: "Builder",
          username: "builderuser",
        };

        const result = await sendOnboardingCompleteEmail(user, "builder");

        expect(result).toBeDefined();
      });

      test("should send onboarding complete email for organization", async () => {
        const user = {
          email: "org@example.com",
          firstName: "Org",
          username: "orguser",
        };

        const result = await sendOnboardingCompleteEmail(user, "organization");

        expect(result).toBeDefined();
      });
    });
  });

  describe("Organization Management Emails", () => {
    describe("sendOrgInviteEmail", () => {
      test("should send organization invite email", async () => {
        const inviter = { email: "owner@example.com", firstName: "Owner" };
        const inviteeEmail = "invitee@example.com";
        const organization = {
          name: "Test Org",
          logo: "https://example.com/logo.png",
        };
        const role: "admin" | "member" = "member";
        const token = "invite-token-123";

        const result = await sendOrgInviteEmail(
          inviter,
          inviteeEmail,
          organization,
          role,
          token
        );

        expect(result).toBeDefined();
      });

      test("should handle organization without logo", async () => {
        const inviter = { email: "owner@example.com", firstName: "Owner" };
        const inviteeEmail = "invitee@example.com";
        const organization = { name: "Test Org" };
        const role: "admin" | "member" = "admin";
        const token = "invite-token-123";

        const result = await sendOrgInviteEmail(
          inviter,
          inviteeEmail,
          organization,
          role,
          token
        );

        expect(result).toBeDefined();
      });
    });
  });

  describe("Bounty Lifecycle Emails", () => {
    describe("sendBountyFirstSubmissionEmail", () => {
      test("should send first submission notification", async () => {
        const recipient = {
          email: "curator@example.com",
          firstName: "Curator",
        };
        const bounty = { id: "bounty-1", title: "Test Bounty" };
        const submission = {
          id: "sub-1",
          title: "First Submission",
          description: "Great work!",
          submitter: { firstName: "Builder", username: "builder1" },
        };

        const result = await sendBountyFirstSubmissionEmail(
          recipient,
          bounty,
          submission
        );

        expect(result).toBeDefined();
      });
    });

    describe("sendBountyDeadlineReminderEmail", () => {
      test("should send deadline reminder", async () => {
        const recipient = {
          email: "curator@example.com",
          firstName: "Curator",
        };
        const bounty = {
          id: "bounty-1",
          title: "Test Bounty",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          submissionCount: 5,
          totalPrize: "1000",
          token: "USDC",
        };

        const result = await sendBountyDeadlineReminderEmail(recipient, bounty);

        expect(result).toBeDefined();
      });
    });

    describe("sendBountyWinnerReminderEmail", () => {
      test("should send winner reminder after deadline", async () => {
        const recipient = {
          email: "curator@example.com",
          firstName: "Curator",
        };
        const bounty = {
          id: "bounty-1",
          title: "Test Bounty",
          deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          submissionCount: 10,
          totalPrize: "5000",
          token: "USDC",
        };

        const result = await sendBountyWinnerReminderEmail(recipient, bounty);

        expect(result).toBeDefined();
      });
    });

    describe("sendBountyWinnerEmail", () => {
      test("should send winner notification", async () => {
        const winner = {
          email: "winner@example.com",
          firstName: "Winner",
          username: "winneruser",
        };
        const bounty = {
          id: "bounty-1",
          title: "Test Bounty",
          organization: { name: "Test Org" },
        };
        const submission = {
          id: "sub-1",
          position: 1,
          prizeAmount: "1000",
          token: "USDC",
        };

        const result = await sendBountyWinnerEmail(winner, bounty, submission);

        expect(result).toBeDefined();
      });
    });
  });

  describe("Grant Lifecycle Emails", () => {
    describe("sendGrantFirstApplicationEmail", () => {
      test("should send first application notification", async () => {
        const curator = { email: "curator@example.com", firstName: "Curator" };
        const grant = { id: "grant-1", title: "Test Grant" };
        const application = {
          id: "app-1",
          title: "Great Application",
          summary: "I would like to...",
          requestedAmount: "5000",
          applicant: { firstName: "Applicant", username: "applicant1" },
        };

        const result = await sendGrantFirstApplicationEmail(
          curator,
          grant,
          application
        );

        expect(result).toBeDefined();
      });
    });

    describe("sendGrantStatusUpdateEmail", () => {
      test("should send approved status update", async () => {
        const applicant = { email: "app@example.com", firstName: "Applicant" };

        const result = await sendGrantStatusUpdateEmail(
          applicant,
          "Test Grant",
          "APPROVED",
          "Congratulations!",
          "http://localhost:3000/applications/1"
        );

        expect(result).toBeDefined();
      });

      test("should send rejected status update", async () => {
        const applicant = { email: "app@example.com", firstName: "Applicant" };

        const result = await sendGrantStatusUpdateEmail(
          applicant,
          "Test Grant",
          "REJECTED",
          "Unfortunately..."
        );

        expect(result).toBeDefined();
      });

      test("should send under review status update", async () => {
        const applicant = { email: "app@example.com", firstName: "Applicant" };

        const result = await sendGrantStatusUpdateEmail(
          applicant,
          "Test Grant",
          "UNDER_REVIEW"
        );

        expect(result).toBeDefined();
      });
    });
  });

  describe("Community & Engagement Emails", () => {
    describe("sendCommentReplyEmail", () => {
      test("should send comment reply notification", async () => {
        const recipient = {
          email: "commenter@example.com",
          firstName: "Commenter",
        };
        const comment = {
          id: "comment-1",
          body: "Great work!",
          contextType: "bounty" as const,
          contextTitle: "Test Bounty",
          contextId: "bounty-1",
        };
        const reply = {
          body: "Thank you!",
          author: { firstName: "Replier", username: "replier1" },
        };

        const result = await sendCommentReplyEmail(recipient, comment, reply);

        expect(result).toBeDefined();
      });

      test("should handle different context types", async () => {
        const recipient = { email: "user@example.com", firstName: "User" };
        const comment = {
          id: "comment-1",
          body: "Looking good",
          contextType: "grant" as const,
          contextTitle: "Test Grant",
          contextId: "grant-1",
        };
        const reply = {
          body: "Thanks!",
          author: { username: "user1" },
        };

        const result = await sendCommentReplyEmail(recipient, comment, reply);

        expect(result).toBeDefined();
      });
    });

    describe("sendWeeklyDigestEmail", () => {
      test("should send weekly digest", async () => {
        const recipient = { email: "user@example.com", firstName: "User" };
        const digestData = {
          weekStartDate: "2024-01-01",
          newBounties: [
            {
              title: "Bounty 1",
              organization: "Org 1",
              amount: "1000",
              id: "b1",
            },
          ],
          newGrants: [
            {
              title: "Grant 1",
              organization: "Org 2",
              amount: "5000",
              id: "g1",
            },
          ],
          applicationUpdates: [
            { title: "App 1", status: "APPROVED", id: "a1" },
          ],
          platformStats: {
            totalOpportunities: 50,
            totalPrizePool: "$100,000",
            activeBuilders: 500,
          },
        };

        const result = await sendWeeklyDigestEmail(recipient, digestData);

        expect(result).toBeDefined();
      });

      test("should handle empty digest data", async () => {
        const recipient = { email: "user@example.com", firstName: "User" };
        const digestData = {
          weekStartDate: "2024-01-01",
          newBounties: [],
          newGrants: [],
          applicationUpdates: [],
          platformStats: {
            totalOpportunities: 0,
            totalPrizePool: "$0",
            activeBuilders: 0,
          },
        };

        const result = await sendWeeklyDigestEmail(recipient, digestData);

        expect(result).toBeDefined();
      });
    });

    describe("sendSkillMatchBountyEmail", () => {
      test("should send skill match notification", async () => {
        const recipient = { email: "user@example.com", firstName: "User" };
        const bounty = {
          id: "bounty-1",
          title: "React Developer Needed",
          description: "Build a web app",
          organization: { name: "Tech Co" },
          prizeAmount: "2000",
          token: "USDC",
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        };
        const matchingSkills = ["React", "TypeScript", "Next.js"];

        const result = await sendSkillMatchBountyEmail(
          recipient,
          bounty,
          matchingSkills
        );

        expect(result).toBeDefined();
      });
    });
  });

  describe("Payment Emails", () => {
    describe("sendPaymentConfirmationEmail", () => {
      test("should send payment confirmation", async () => {
        const recipient = {
          email: "winner@example.com",
          firstName: "Winner",
          username: "winneruser",
        };
        const bounty = {
          id: "bounty-1",
          title: "Test Bounty",
          organization: { name: "Test Org" },
        };
        const payment = {
          amount: "1000",
          token: "USDC",
          transactionId: "txn-123456",
        };

        const result = await sendPaymentConfirmationEmail(
          recipient,
          bounty,
          payment
        );

        expect(result).toBeDefined();
      });
    });
  });
});
