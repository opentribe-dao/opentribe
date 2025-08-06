// Base template and components
export { default as BaseTemplate } from './base-template';
export * from './components';

// Authentication & Onboarding
export { default as VerificationEmail } from './verification-email';
export { default as WelcomeEmail } from './welcome-email';
export { default as PasswordResetEmail } from './password-reset';
export { default as OnboardingCompleteEmail } from './onboarding-complete';

// Organization Management
export { default as OrgInviteEmail } from './org-invite';

// Bounty Emails
export { default as BountyFirstSubmissionEmail } from './bounty-first-submission';
export { default as BountyDeadlineReminderEmail } from './bounty-deadline-reminder';
export { default as BountyWinnerReminderEmail } from './bounty-winner-reminder';
export { default as BountyWinnerEmail } from './bounty-winner';
export { default as BountySkillMatchEmail } from './bounty-skill-match';

// Payment Emails
export { default as PaymentConfirmationEmail } from './payment-confirmation';

// Grant Emails
export { default as GrantFirstApplicationEmail } from './grant-first-application';
export { default as GrantStatusUpdateEmail } from './grant-status-update';

// Community & Engagement
export { default as CommentReplyEmail } from './comment-reply';
export { default as WeeklyDigestEmail } from './weekly-digest';

// Legacy
export { default as ContactTemplate } from './contact';