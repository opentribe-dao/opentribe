// Email template prop types

export interface BaseEmailUser {
  email: string;
  firstName?: string;
  username?: string;
}

export interface Organization {
  id: string;
  name: string;
  logo?: string;
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  organization: Organization;
  totalPrize: string;
  token: string;
  submissionCount?: number;
}

export interface Grant {
  id: string;
  title: string;
  organization: Organization;
}

export interface Submission {
  id: string;
  title: string;
  description: string;
  submitter: BaseEmailUser;
  position?: number;
  prizeAmount?: string;
  token?: string;
}

export interface Application {
  id: string;
  title: string;
  summary: string;
  requestedAmount: string;
  applicant: BaseEmailUser;
  previousStatus?: string;
  newStatus?: string;
  feedback?: string;
  nextSteps?: string;
}

export interface Comment {
  id: string;
  body: string;
  author: BaseEmailUser;
  contextType: "grant" | "bounty" | "rfp" | "submission" | "application";
  contextTitle: string;
  contextId: string;
}

// Email service response type
export interface EmailResponse {
  id: string;
  success: boolean;
  error?: string;
}

// Notification preferences
export interface NotificationPreferences {
  emailVerification: boolean;
  onboardingComplete: boolean;
  passwordReset: boolean;
  organizationInvite: boolean;
  bountyFirstSubmission: boolean;
  bountyDeadlineReminder: boolean;
  bountyWinnerReminder: boolean;
  bountyWinner: boolean;
  grantFirstApplication: boolean;
  grantStatusUpdate: boolean;
  commentReply: boolean;
  weeklyDigest: boolean;
  skillMatchBounty: boolean;
}
