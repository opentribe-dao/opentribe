# Opentribe Email Package

This package contains all email templates and utilities for the Opentribe platform using React Email and Resend.

## Email Templates

### Authentication & Onboarding
- **VerificationEmail** - Email verification for new signups
- **WelcomeEmail** - Welcome message after email verification  
- **PasswordResetEmail** - Password reset requests
- **OnboardingCompleteEmail** - Confirmation after profile completion

### Organization Management
- **OrgInviteEmail** - Invite users to join organizations (Better Auth integration)

### Bounty Lifecycle
- **BountyFirstSubmissionEmail** - Notify org when first submission received
- **BountyDeadlineReminderEmail** - Remind org 3 days before deadline
- **BountyWinnerReminderEmail** - Remind org to announce winners after deadline
- **BountyWinnerEmail** - Congratulate winners
- **BountySkillMatchEmail** - Notify builders about matching bounties

### Grant Lifecycle
- **GrantFirstApplicationEmail** - Notify curator of first application
- **GrantStatusUpdateEmail** - Notify applicants of status changes

### Community & Engagement
- **CommentReplyEmail** - Notify users of replies to their comments
- **WeeklyDigestEmail** - Weekly summary of opportunities and updates

## Usage

### Import Email Service Functions

```typescript
import { 
  sendVerificationEmail,
  sendWelcomeEmail,
  sendBountyFirstSubmissionEmail,
  // ... other functions
} from '@packages/email';
```

### Send an Email

```typescript
// Example: Send verification email
await sendVerificationEmail(
  { 
    email: 'user@example.com',
    firstName: 'Alice',
    username: 'alice123'
  },
  'verification-token-here',
  '123456' // optional verification code
);

// Example: Send bounty winner email
await sendBountyWinnerEmail(
  {
    email: 'winner@example.com',
    firstName: 'Bob',
    username: 'bob456'
  },
  {
    id: 'bounty-123',
    title: 'Build Polkadot Tutorial',
    organization: { name: 'Web3 Foundation' }
  },
  {
    id: 'submission-456',
    position: 1,
    prizeAmount: '1000',
    token: 'USDT'
  }
);
```

## Email Components

The package includes reusable components for consistent email styling:

- **BaseTemplate** - Base wrapper with header/footer
- **EmailButton** - CTA buttons (primary/secondary variants)
- **EmailHeading** - Consistent headings
- **EmailText** - Formatted text
- **EmailCard** - Content cards with glass morphism effect
- **EmailDivider** - Section separators
- **EmailHighlight** - Key-value pairs
- **EmailList** - Bulleted lists
- **EmailLink** - Styled links

## Environment Variables

Required environment variables:

```env
RESEND_TOKEN=your-resend-api-key
RESEND_FROM=hello@opentribe.io
NEXT_PUBLIC_WEB_URL=https://opentribe.io
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.opentribe.io
```

## Testing Email Templates

During development, you can preview email templates:

1. Install React Email dev server:
```bash
pnpm add -D @react-email/preview-email
```

2. Add preview script to package.json:
```json
{
  "scripts": {
    "email:dev": "email dev --dir ./templates"
  }
}
```

3. Run the preview server:
```bash
pnpm email:dev
```

## Better Auth Integration

For organization invites, the email service integrates with Better Auth's invitation system:

```typescript
// In your API route
import { auth } from '@packages/auth/server';
import { sendOrgInviteEmail } from '@packages/email';

// Create invitation with Better Auth
const invitation = await auth.api.createInvitation({
  email: inviteeEmail,
  organizationId,
  role,
});

// Send invite email
await sendOrgInviteEmail(
  inviter,
  inviteeEmail,
  organization,
  role,
  invitation.token
);
```

## Notification Preferences

Emails respect user notification preferences stored in the database:

```typescript
// Check user preferences before sending
const preferences = await db.notificationSetting.findMany({
  where: {
    userId: user.id,
    channel: 'EMAIL',
    isEnabled: true,
  },
});

// Only send if user has enabled this notification type
if (preferences.some(p => p.type === 'BOUNTY_SUBMISSION')) {
  await sendBountyFirstSubmissionEmail(...);
}
```

## Adding New Email Templates

1. Create template in `templates/` directory
2. Export from `templates/index.ts`
3. Add service function in `services/email-service.ts`
4. Update types in `types.ts`
5. Document in this README

## Email Design Guidelines

- Use Opentribe branding colors (Polkadot pink #E6007A)
- Maintain glass morphism theme consistency
- Keep emails mobile-responsive
- Include clear CTAs
- Add unsubscribe links where appropriate
- Use preview text effectively