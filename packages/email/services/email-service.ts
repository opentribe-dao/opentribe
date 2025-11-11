import { resend } from "../index";
import {
  BountyDeadlineReminderEmail,
  BountyFirstSubmissionEmail,
  BountySkillMatchEmail,
  BountyWinnerEmail,
  BountyWinnerReminderEmail,
  CommentReplyEmail,
  GrantFirstApplicationEmail,
  GrantStatusUpdateEmail,
  OnboardingCompleteEmail,
  OrgInviteEmail,
  PasswordResetEmail,
  PaymentConfirmationEmail,
  VerificationEmail,
  WeeklyDigestEmail,
  WelcomeEmail,
} from "../templates";

const FROM_EMAIL_ADDRESS =
  process.env.RESEND_FROM || "hello@notifications.opentribe.io";
const FROM_EMAIL = `Opentribe <${FROM_EMAIL_ADDRESS}>`;
const BASE_URL = process.env.NEXT_PUBLIC_WEB_URL;
const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL;

export { FROM_EMAIL_ADDRESS, FROM_EMAIL, BASE_URL, DASHBOARD_URL };

interface EmailUser {
  email: string;
  firstName?: string;
  username?: string;
}

// Helper to get user display name
const getUserName = (user: EmailUser) =>
  user.firstName || user.username || "there";

// Authentication & Onboarding Emails

export async function sendVerificationEmail(
  user: EmailUser,
  verificationToken: string,
  verificationCode?: string
) {
  const verificationUrl = `${BASE_URL}/verify-email?token=${verificationToken}`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [user.email],
    subject: "Verify your email for Opentribe",
    react: VerificationEmail({
      username: getUserName(user),
      verificationUrl,
      verificationCode,
    }),
  });
}

export async function sendWelcomeEmail(user: EmailUser) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to: [user.email],
    subject: "Welcome to Opentribe!",
    react: WelcomeEmail({
      firstName: getUserName(user),
      url: `${BASE_URL}/onboarding`,
    }),
  });
}

export async function sendPasswordResetEmail(
  user: EmailUser,
  resetToken: string
) {
  const resetUrl = `${BASE_URL}/reset-password?token=${resetToken}`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [user.email],
    subject: "Reset your Opentribe password",
    react: PasswordResetEmail({
      username: getUserName(user),
      resetUrl,
    }),
  });
}

export async function sendOnboardingCompleteEmail(
  user: EmailUser,
  userType: "builder" | "organization"
) {
  const exploreUrl =
    userType === "builder"
      ? `${BASE_URL}/bounties`
      : `${DASHBOARD_URL}/bounties/create`;
  const profileUrl =
    userType === "builder"
      ? `${BASE_URL}/profile/${user.username}`
      : `${DASHBOARD_URL}/org/settings`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [user.email],
    subject: "Your Opentribe profile is ready!",
    react: OnboardingCompleteEmail({
      firstName: getUserName(user),
      userType,
      exploreUrl,
      profileUrl,
    }),
  });
}

// Organization Management Emails

export async function sendOrgInviteEmail(
  inviter: EmailUser,
  inviteeEmail: string,
  organization: {
    name: string;
    logo?: string;
  },
  role: "admin" | "member",
  inviteToken: string
) {
  const inviteUrl = `${BASE_URL}/org-invite?token=${inviteToken}`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [inviteeEmail],
    subject: `You're invited to join ${organization.name} on Opentribe`,
    react: OrgInviteEmail({
      inviterName: getUserName(inviter),
      inviteeEmail,
      organizationName: organization.name,
      organizationLogo: organization.logo,
      role,
      inviteUrl,
    }),
  });
}

// Bounty Lifecycle Emails

export async function sendBountyFirstSubmissionEmail(
  recipient: EmailUser,
  bounty: {
    id: string;
    title: string;
  },
  submission: {
    id: string;
    title: string;
    description: string;
    submitter: {
      firstName?: string;
      username: string;
    };
  }
) {
  const viewSubmissionUrl = `${DASHBOARD_URL}/bounties/${bounty.id}/submissions/${submission.id}`;
  const viewAllUrl = `${DASHBOARD_URL}/bounties/${bounty.id}/submissions`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [recipient.email],
    subject: `First submission received for "${bounty.title}"`,
    react: BountyFirstSubmissionEmail({
      recipientName: getUserName(recipient),
      bountyTitle: bounty.title,
      submitterName:
        submission.submitter.firstName || submission.submitter.username,
      submissionTitle: submission.title,
      submissionPreview: submission.description,
      viewSubmissionUrl,
      viewAllUrl,
    }),
  });
}

export async function sendBountyDeadlineReminderEmail(
  recipient: EmailUser,
  bounty: {
    id: string;
    title: string;
    deadline: Date;
    submissionCount: number;
    totalPrize: string;
    token: string;
  }
) {
  const daysRemaining = Math.ceil(
    (bounty.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const reviewUrl = `${DASHBOARD_URL}/bounties/${bounty.id}/submissions`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [recipient.email],
    subject: `Bounty deadline approaching - ${daysRemaining} days left`,
    react: BountyDeadlineReminderEmail({
      recipientName: getUserName(recipient),
      bountyTitle: bounty.title,
      deadline: bounty.deadline.toLocaleDateString(),
      daysRemaining,
      submissionCount: bounty.submissionCount,
      totalPrize: `${bounty.totalPrize} ${bounty.token}`,
      reviewUrl,
    }),
  });
}

export async function sendBountyWinnerReminderEmail(
  recipient: EmailUser,
  bounty: {
    id: string;
    title: string;
    deadline: Date;
    submissionCount: number;
    totalPrize: string;
    token: string;
  }
) {
  const daysPastDeadline = Math.ceil(
    (Date.now() - bounty.deadline.getTime()) / (1000 * 60 * 60 * 24)
  );
  const announceUrl = `${DASHBOARD_URL}/bounties/${bounty.id}/submissions`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [recipient.email],
    subject: "Time to announce bounty winners!",
    react: BountyWinnerReminderEmail({
      recipientName: getUserName(recipient),
      bountyTitle: bounty.title,
      daysPastDeadline,
      submissionCount: bounty.submissionCount,
      totalPrize: `${bounty.totalPrize} ${bounty.token}`,
      announceUrl,
    }),
  });
}

export async function sendBountyWinnerEmail(
  winner: EmailUser,
  bounty: {
    id: string;
    title: string;
    organization: {
      name: string;
    };
  },
  submission: {
    id: string;
    position: number;
    prizeAmount: string;
    token: string;
  }
) {
  const submissionUrl = `${BASE_URL}/bounties/${bounty.id}/submissions/${submission.id}`;
  const profileUrl = `${BASE_URL}/profile/${winner.username}`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [winner.email],
    subject: "Congratulations! You won a bounty 🎉",
    react: BountyWinnerEmail({
      winnerName: getUserName(winner),
      bountyTitle: bounty.title,
      organizationName: bounty.organization.name,
      position: submission.position,
      prizeAmount: submission.prizeAmount,
      token: submission.token,
      submissionUrl,
      profileUrl,
    }),
  });
}

// Grant Lifecycle Emails

export async function sendGrantFirstApplicationEmail(
  curator: EmailUser,
  grant: {
    id: string;
    title: string;
  },
  application: {
    id: string;
    title: string;
    summary: string;
    requestedAmount: string;
    applicant: {
      firstName?: string;
      username: string;
    };
  }
) {
  const viewApplicationUrl = `${DASHBOARD_URL}/grants/${grant.id}/applications/${application.id}`;
  const viewAllUrl = `${DASHBOARD_URL}/grants/${grant.id}/applications`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [curator.email],
    subject: `First application received for "${grant.title}"`,
    react: GrantFirstApplicationEmail({
      curatorName: getUserName(curator),
      grantTitle: grant.title,
      applicantName:
        application.applicant.firstName || application.applicant.username,
      applicationTitle: application.title,
      applicationSummary: application.summary,
      requestedAmount: application.requestedAmount,
      viewApplicationUrl,
      viewAllUrl,
    }),
  });
}

export async function sendGrantStatusUpdateEmail(
  applicant: EmailUser,
  grantTitle: string,
  newStatus: "APPROVED" | "REJECTED" | "UNDER_REVIEW",
  feedback?: string,
  applicationUrl?: string
) {
  const isApproved = newStatus === "APPROVED";
  const subject = isApproved
    ? "🎉 Your grant application has been approved!"
    : newStatus === "REJECTED"
      ? "Grant application update"
      : "Your application is under review";

  const defaultUrl =
    applicationUrl ||
    `${BASE_URL}/profile/${applicant.username || "me"}/applications`;
  const nextSteps = isApproved
    ? "The organization will contact you soon with next steps and funding details."
    : newStatus === "UNDER_REVIEW"
      ? "Your application is being carefully reviewed. We'll notify you once a decision is made."
      : undefined;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [applicant.email],
    subject,
    react: GrantStatusUpdateEmail({
      applicantName: getUserName(applicant),
      grantTitle,
      organizationName: "", // We'll update the template to not require this
      previousStatus: "PENDING",
      newStatus,
      feedback,
      applicationUrl: defaultUrl,
      nextSteps,
    }),
  });
}

// Community & Engagement Emails

export async function sendCommentReplyEmail(
  recipient: EmailUser,
  comment: {
    id: string;
    body: string;
    contextType: "grant" | "bounty" | "rfp" | "submission" | "application";
    contextTitle: string;
    contextId: string;
  },
  reply: {
    body: string;
    author: {
      firstName?: string;
      username: string;
    };
  }
) {
  const threadUrl = `${BASE_URL}/${comment.contextType}s/${comment.contextId}#comment-${comment.id}`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [recipient.email],
    subject: `${
      reply.author.firstName || reply.author.username
    } replied to your comment`,
    react: CommentReplyEmail({
      recipientName: getUserName(recipient),
      replierName: reply.author.firstName || reply.author.username,
      originalComment: comment.body,
      replyContent: reply.body,
      contextType: comment.contextType,
      contextTitle: comment.contextTitle,
      threadUrl,
    }),
  });
}

export async function sendWeeklyDigestEmail(
  recipient: EmailUser,
  digestData: {
    weekStartDate: string;
    newBounties: Array<{
      title: string;
      organization: string;
      amount: string;
      id: string;
    }>;
    newGrants: Array<{
      title: string;
      organization: string;
      amount: string;
      id: string;
    }>;
    applicationUpdates: Array<{
      title: string;
      status: string;
      id: string;
    }>;
    platformStats: {
      totalOpportunities: number;
      totalPrizePool: string;
      activeBuilders: number;
    };
  }
) {
  const opportunities = [
    ...digestData.newBounties.map((b) => ({
      ...b,
      url: `${BASE_URL}/bounties/${b.id}`,
    })),
    ...digestData.newGrants.map((g) => ({
      ...g,
      url: `${BASE_URL}/grants/${g.id}`,
    })),
  ];

  const applicationUpdates = digestData.applicationUpdates.map((a) => ({
    ...a,
    url: `${BASE_URL}/applications/${a.id}`,
  }));

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [recipient.email],
    subject: "Your Opentribe weekly digest",
    react: WeeklyDigestEmail({
      recipientName: getUserName(recipient),
      weekStartDate: digestData.weekStartDate,
      newBounties: digestData.newBounties.map((b) => ({
        ...b,
        url: `${BASE_URL}/bounties/${b.id}`,
      })),
      newGrants: digestData.newGrants.map((g) => ({
        ...g,
        url: `${BASE_URL}/grants/${g.id}`,
      })),
      applicationUpdates,
      platformStats: digestData.platformStats,
      dashboardUrl: DASHBOARD_URL || "",
    }),
  });
}

export async function sendSkillMatchBountyEmail(
  recipient: EmailUser,
  bounty: {
    id: string;
    title: string;
    description: string;
    organization: {
      name: string;
    };
    prizeAmount: string;
    token: string;
    deadline: Date;
  },
  matchingSkills: string[]
) {
  const bountyUrl = `${BASE_URL}/bounties/${bounty.id}`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to: [recipient.email],
    subject: `New bounty matches your skills: ${bounty.title}`,
    react: BountySkillMatchEmail({
      recipientName: getUserName(recipient),
      bountyTitle: bounty.title,
      organizationName: bounty.organization.name,
      matchingSkills,
      bountyDescription: bounty.description,
      prizeAmount: `${bounty.prizeAmount} ${bounty.token}`,
      deadline: bounty.deadline.toLocaleDateString(),
      bountyUrl,
    }),
  });
}

// Payment Emails

export async function sendPaymentConfirmationEmail(
  recipient: EmailUser,
  bounty: {
    id: string;
    title: string;
    organization: {
      name: string;
    };
  },
  payment: {
    amount: string;
    token: string;
    transactionId: string;
  }
) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to: [recipient.email],
    subject: "Payment Confirmed! 💸",
    react: PaymentConfirmationEmail({
      user: recipient,
      bounty,
      payment,
    }),
  });
}
