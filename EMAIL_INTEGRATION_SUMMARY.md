# Email Integration Summary

## ✅ Completed Email Integrations

### 1. Better Auth Email Hooks

#### Email Verification
```typescript
// packages/auth/server.ts
emailVerification: {
  sendVerificationEmail: async ({ user, url, token }) => {
    await sendVerificationEmail(user, token);
  },
  sendOnEmailVerificationSuccess: async ({ user }) => {
    await sendWelcomeEmail(user);
  },
}
```

#### Password Reset
```typescript
emailAndPassword: {
  requireEmailVerification: true,
  sendResetPassword: async ({ user, url, token }) => {
    await sendPasswordResetEmail(user, token);
  },
}
```

#### Organization Invitations
```typescript
organization({
  sendInvitationEmail: async (data) => {
    await sendOrgInviteEmail(inviter, inviteeEmail, org, role, inviteId);
  },
})
```

### 2. API Endpoint Email Triggers

#### Profile Completion
- **Location**: `/api/v1/users/[id]` - PATCH
- **Trigger**: First time setting `profileCompleted: true`
- **Email**: Onboarding complete (builder type)

#### Organization Creation
- **Location**: `/api/v1/organizations` - POST
- **Trigger**: Creating organization for first-time users
- **Email**: Onboarding complete (organization type)

#### First Bounty Submission
- **Location**: `/api/v1/bounties/[id]/submissions` - POST
- **Trigger**: First submission to a bounty
- **Recipients**: Organization admins/owners
- **Email**: Bounty first submission notification

#### First Grant Application
- **Location**: `/api/v1/grants/[id]/applications` - POST
- **Trigger**: First application to a grant
- **Recipients**: Grant curators (org admins/owners)
- **Email**: Grant first application notification

### 3. Cron Jobs

#### Bounty Deadline Reminder
- **Route**: `/cron/bounty-deadline-reminder`
- **Schedule**: Daily
- **Trigger**: Bounties with deadline in 3 days
- **Recipients**: Organization admins/owners
- **Tracking**: `lastReminderSentAt` field

#### Winner Announcement Reminder
- **Route**: `/cron/winner-announcement-reminder`
- **Schedule**: Daily
- **Trigger**: Bounties 7+ days past deadline without winners
- **Recipients**: Organization admins/owners
- **Tracking**: `lastWinnerReminderSentAt` field

#### Weekly Digest
- **Route**: `/cron/weekly-digest`
- **Schedule**: Weekly (Mondays)
- **Recipients**: Users with email notifications enabled
- **Content**: New opportunities, application updates, platform stats

## 📋 Pending Email Integrations

### 1. Grant Application Status Updates
Need to implement in grant application status update endpoint:
```typescript
// When curator updates application status
await sendGrantStatusUpdateEmail(applicant, grant, {
  previousStatus,
  newStatus,
  feedback,
  nextSteps
});
```

### 2. Bounty Winner Announcements
Need to implement in winner announcement endpoint:
```typescript
// When organization announces winners
for (const winner of winners) {
  await sendBountyWinnerEmail(winner, bounty, {
    position,
    prizeAmount,
    token
  });
}
```

### 3. Comment Reply Notifications
Need to implement in comment creation endpoint:
```typescript
// When someone replies to a comment
if (parentComment && parentComment.authorId !== replier.id) {
  await sendCommentReplyEmail(parentComment.author, comment, reply);
}
```

### 4. Skill-Based Bounty Notifications
Need to implement when new bounty is created:
```typescript
// Find users with matching skills
const matchingUsers = await findUsersWithSkills(bounty.skills);
for (const user of matchingUsers) {
  await sendSkillMatchBountyEmail(user, bounty);
}
```

## 🔧 Database Updates Required

Run migration to add tracking fields:
```bash
cd packages/db
pnpm db:push
```

New fields added to Bounty model:
- `lastReminderSentAt`: Tracks deadline reminder emails
- `lastWinnerReminderSentAt`: Tracks winner announcement reminders

## 🚀 Deployment Configuration

### Environment Variables
```env
# Email Service
RESEND_TOKEN=re_xxxxxxxxxxxx
RESEND_FROM=hello@opentribe.io

# URLs for email links
NEXT_PUBLIC_WEB_URL=https://opentribe.io
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.opentribe.io
```

### Cron Job Schedule (for production)
```yaml
# vercel.json or cron configuration
{
  "crons": [
    {
      "path": "/api/cron/bounty-deadline-reminder",
      "schedule": "0 9 * * *"  # Daily at 9 AM
    },
    {
      "path": "/api/cron/winner-announcement-reminder", 
      "schedule": "0 10 * * *" # Daily at 10 AM
    },
    {
      "path": "/api/cron/weekly-digest",
      "schedule": "0 9 * * 1"  # Mondays at 9 AM
    }
  ]
}
```

## 🧪 Testing Email Integration

1. **Test Better Auth emails**:
   - Sign up with email → Verification email
   - Verify email → Welcome email
   - Request password reset → Reset email
   - Create organization invite → Invite email

2. **Test notification emails**:
   - Create first submission → First submission email
   - Create first application → First application email
   - Complete profile → Onboarding complete email

3. **Test cron jobs locally**:
   ```bash
   # Test individual cron endpoints
   curl http://localhost:3002/cron/bounty-deadline-reminder
   curl http://localhost:3002/cron/winner-announcement-reminder
   curl http://localhost:3002/cron/weekly-digest
   ```

## 📝 Notes

- All emails respect user notification preferences
- Email sending failures don't block API operations
- Cron jobs include error tracking and reporting
- Email templates use glass morphism design matching UI
- Unsubscribe links included in non-critical emails