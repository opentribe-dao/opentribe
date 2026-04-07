# Phase 7 Test Prompt: Public Web — Claim Flow UI

## Overview

**Phase 7** tests the **public web claim flow UI** — the entire user-facing journey for claiming ecosystem profiles. This includes the claim form, method selection, credential verification, and success confirmation.

**Location**: `http://localhost:3000/[locale]/profile/claim/{ecosystem-slug}`  
**Component Size**: 910-line client component with full state management  
**Test Environment**: Web app running at `localhost:3000`  
**Data Requirements**: Unclaimed ecosystem profiles (seeded in database)

---

## Prerequisites

Before starting Phase 7 testing, ensure:

1. ✅ **Phase 6 complete** — All profile pages tested and working
2. ✅ **Web app running** — `http://localhost:3000` accessible
3. ✅ **Database populated** — Ecosystem profiles with `claimedByUserId = NULL`
4. ✅ **Chrome DevTools available** — For network inspection and state validation

### Required Test Profiles

The following **unclaimed ecosystem profiles** must exist in the database:

| Username | Email | Slug | Status |
| -------- | ----- | ---- | ------ |
| Yvonne Xie | yvonne@example.com | yvonne-xie | Ready to claim |
| Dr. John Wu | john@example.com | dr-john-wu | Ready to claim |
| Hao Ding | hao@example.com | moehringen | Ready to claim |

**Verify unclaimed status**:
```sql
SELECT id, displayName, slug, claimedByUserId FROM ecosystem_profile 
WHERE claimedByUserId IS NULL 
ORDER BY displayName;
```

Expected result: `claimedByUserId` column is NULL for all test profiles.

---

## Test Scenarios

### Test 7.1: Claim Form Initial State

**Objective**: Verify the claim form loads with correct initial UI state and no validation errors.

**URL**: `http://localhost:3000/en/profile/claim/yvonne-xie`

| Step | Action | Expected | Status |
| ---- | ------ | -------- | ------ |
| 1 | Navigate to claim page | Page loads without 404 | ⬜ |
| 2 | Check form title | Displays "Claim this profile" | ⬜ |
| 3 | Check profile info | Shows Yvonne Xie details (name, slug, email) | ⬜ |
| 4 | Check method selector | 3 claim methods visible (Email, GitHub OAuth, Wallet) | ⬜ |
| 5 | Check default method | Email verification selected by default | ⬜ |
| 6 | Check form state | All form fields empty/reset | ⬜ |
| 7 | Check console | No errors or warnings | ⬜ |

**Known Issues**: None expected. If you see console errors, note them.

**Test 7.1 Result**: ⬜ **NOT STARTED**

---

### Test 7.2: Email Verification Method

**Objective**: Verify the email verification claim method works correctly with input validation.

**URL**: `http://localhost:3000/en/profile/claim/yvonne-xie`

| Step | Action | Expected | Status |
| ---- | ------ | -------- | ------ |
| 1 | Click "Email Verification" tab | Form displays email input field | ⬜ |
| 2 | Leave email empty | "Submit" button disabled or shows validation error | ⬜ |
| 3 | Enter invalid email (e.g., "notanemail") | Validation error appears: "Invalid email address" | ⬜ |
| 4 | Enter valid email (e.g., "user@example.com") | Validation passes, button becomes enabled | ⬜ |
| 5 | Click "Submit" button | Request sent to API, loading state shown | ⬜ |
| 6 | Check success state | "Verification email sent to user@example.com" message displayed | ⬜ |
| 7 | Check success CTA | Button shows "Check Email" or similar next step | ⬜ |

**Test Data**:
- Use Yvonne's actual email: `yvonne@example.com`
- Alternative: Use any valid test email

**Expected API Call**:
```
POST /api/v1/claims/request
Body: {
  "ecosystemProfileId": "...",
  "method": "EMAIL_VERIFICATION",
  "email": "yvonne@example.com",
  "verificationToken": "email-verification-token"
}
```

**Test 7.2 Result**: ⬜ **NOT STARTED**

---

### Test 7.3: GitHub OAuth Method

**Objective**: Verify the GitHub OAuth claim method initiates OAuth flow correctly.

**URL**: `http://localhost:3000/en/profile/claim/yvonne-xie`

| Step | Action | Expected | Status |
| ---- | ------ | -------- | ------ |
| 1 | Click "GitHub OAuth" tab | Form displays GitHub login button | ⬜ |
| 2 | Check button text | Button says "Sign in with GitHub" | ⬜ |
| 3 | Check button state | Button is enabled and clickable | ⬜ |
| 4 | Hover over button | Button styling changes (hover effect visible) | ⬜ |
| 5 | Click "Sign in with GitHub" button | Page navigates to GitHub OAuth consent screen OR displays mock consent UI | ⬜ |
| 6 | Check console | OAuth initialization logged (if using mock) | ⬜ |

**Test Data**: Use a test GitHub account (or note that this may require external OAuth).

**Expected Behavior**:
- If GitHub OAuth is configured: Redirects to GitHub consent screen
- If not configured: Shows placeholder UI or error message
- State is preserved: After OAuth return, ecosystem profile is still visible

**Test 7.3 Result**: ⬜ **NOT STARTED**

---

### Test 7.4: Wallet Signature Method

**Objective**: Verify the wallet signature claim method displays wallet connection UI.

**URL**: `http://localhost:3000/en/profile/claim/yvonne-xie`

| Step | Action | Expected | Status |
| ---- | ------ | -------- | ------ |
| 1 | Click "Wallet Signature" tab | Form displays wallet connection section | ⬜ |
| 2 | Check UI text | Instructions visible: "Sign with your Polkadot wallet" or similar | ⬜ |
| 3 | Check wallet list | Available wallet extensions displayed (if wallets available) | ⬜ |
| 4 | Check "Connect Wallet" button | Button visible and enabled | ⬜ |
| 5 | Click "Connect Wallet" button | Attempts to connect to wallet OR shows mock connection state | ⬜ |
| 6 | Check wallet connection status | Success message or loading state displayed | ⬜ |
| 7 | Check address display | Connected wallet address shown (or placeholder in test mode) | ⬜ |

**Test Data**: Use a test wallet address (or note that this requires wallet extension).

**Expected Flow**:
- Clicking "Connect Wallet" triggers wallet extension
- After approval, wallet address is displayed
- "Sign Message" button appears to allow signing

**Test 7.4 Result**: ⬜ **NOT STARTED**

---

### Test 7.5: Form Switching & State Preservation

**Objective**: Verify switching between claim methods preserves form state and doesn't cause errors.

**URL**: `http://localhost:3000/en/profile/claim/yvonne-xie`

| Step | Action | Expected | Status |
| ---- | ------ | -------- | ------ |
| 1 | Click "Email Verification" tab | Email input visible | ⬜ |
| 2 | Enter email: "user@example.com" | Field shows entered value | ⬜ |
| 3 | Click "GitHub OAuth" tab | GitHub form displayed, email field gone | ⬜ |
| 4 | Click back to "Email Verification" tab | **Email field is cleared** (state reset) | ⬜ |
| 5 | Verify no console errors | No errors when switching tabs | ⬜ |
| 6 | Check form re-renders | Tab switching is instant, no flicker | ⬜ |

**Expected Behavior**:
- Switching between tabs clears previous form state (or preserves it — verify current behavior)
- No console errors during tab switching
- Form renders correctly after each switch

**Note**: Clarify with team whether form state should persist or reset when switching methods.

**Test 7.5 Result**: ⬜ **NOT STARTED**

---

### Test 7.6: Error Handling

**Objective**: Verify error messages are displayed correctly when API requests fail.

**URL**: `http://localhost:3000/en/profile/claim/yvonne-xie`

| Step | Action | Expected | Status |
| ---- | ------ | -------- | ------ |
| 1 | Submit email form with existing email | Error: "Email already claimed" or similar | ⬜ |
| 2 | Submit form twice rapidly | Prevent double submission (disable button) | ⬜ |
| 3 | Check error styling | Error message displayed in red/warning color | ⬜ |
| 4 | Check error persistence | Error remains until user corrects input | ⬜ |
| 5 | Check retry behavior | User can click submit again after error | ⬜ |

**Error Scenarios to Test**:
- Invalid email format
- Email already associated with another claim
- Network timeout (use DevTools throttling)
- 500 server error response

**Test 7.6 Result**: ⬜ **NOT STARTED**

---

### Test 7.7: Success Confirmation

**Objective**: Verify successful claim submission shows confirmation UI and updates state.

**URL**: `http://localhost:3000/en/profile/claim/yvonne-xie`

| Step | Action | Expected | Status |
| ---- | ------ | -------- | ------ |
| 1 | Submit valid email claim | API request succeeds (200/201 status) | ⬜ |
| 2 | Check success message | Confirmation message displayed: "Claim submitted successfully" | ⬜ |
| 3 | Check success CTA | Button to view profile or next steps visible | ⬜ |
| 4 | Check form reset | Form is cleared/disabled after submission | ⬜ |
| 5 | Check redirect | Option to navigate to dashboard or home | ⬜ |
| 6 | Verify claim in DB | New `claim_request` record created in database with PENDING status | ⬜ |

**Expected Database State After Submission**:
```sql
SELECT * FROM claim_request 
WHERE ecosystem_profile_id = (SELECT id FROM ecosystem_profile WHERE slug = 'yvonne-xie')
ORDER BY created_at DESC LIMIT 1;
```

Expected columns:
- `status`: 'PENDING'
- `method`: 'EMAIL_VERIFICATION'
- `email`: (user's email)
- `created_at`: recent timestamp

**Test 7.7 Result**: ⬜ **NOT STARTED**

---

### Test 7.8: Responsive Design

**Objective**: Verify claim form works on mobile and desktop viewports.

**Breakpoints to Test**:
- Desktop: 1920x1080
- Tablet: 768x1024
- Mobile: 375x667

| Viewport | Aspect | Expected | Status |
| -------- | ------ | -------- | ------ |
| Mobile | Form width | Full width with padding (no overflow) | ⬜ |
| Mobile | Font sizes | Readable (14px+ for inputs) | ⬜ |
| Mobile | Button size | Touch-friendly (44px minimum height) | ⬜ |
| Tablet | Layout | 2-column or centered | ⬜ |
| Desktop | Layout | Full form visible without scrolling | ⬜ |
| All | Scroll behavior | No horizontal scroll | ⬜ |

**Test in DevTools**:
1. Press F12 to open DevTools
2. Click Device Emulation icon (or Ctrl+Shift+M)
3. Select each viewport and test form interaction

**Test 7.8 Result**: ⬜ **NOT STARTED**

---

### Test 7.9: Navigation & Back Button

**Objective**: Verify navigation from claim form works correctly.

| Step | Action | Expected | Status |
| ---- | ------ | -------- | ------ |
| 1 | Navigate to claim form | Page loads at `/profile/claim/yvonne-xie` | ⬜ |
| 2 | Click back button in browser | Returns to previous page (profile or home) | ⬜ |
| 3 | Navigate away from form | No unsaved data warning (or warning if needed) | ⬜ |
| 4 | Click on profile link | Navigates to ecosystem profile page | ⬜ |
| 5 | Click "Cancel" button (if exists) | Returns to home or profile page | ⬜ |

**Test 7.9 Result**: ⬜ **NOT STARTED**

---

### Test 7.10: Multiple Claims Same Profile

**Objective**: Verify user cannot submit multiple claims for the same profile.

| Step | Action | Expected | Status |
| ---- | ------ | -------- | ------ |
| 1 | Submit claim for yvonne-xie with email1@test.com | Claim created successfully | ⬜ |
| 2 | Submit second claim for same profile with email2@test.com | Error: "Profile already has pending claim" | ⬜ |
| 3 | Check database | Only 1 claim_request record for this profile | ⬜ |

**Database Check**:
```sql
SELECT COUNT(*) FROM claim_request 
WHERE ecosystem_profile_id = (SELECT id FROM ecosystem_profile WHERE slug = 'yvonne-xie');
```

Expected result: 1 (only the first claim)

**Test 7.10 Result**: ⬜ **NOT STARTED**

---

## Summary

| Test | Name | Status | Notes |
| ---- | ---- | ------ | ----- |
| 7.1 | Claim Form Initial State | ⬜ | NOT STARTED |
| 7.2 | Email Verification Method | ⬜ | NOT STARTED |
| 7.3 | GitHub OAuth Method | ⬜ | NOT STARTED |
| 7.4 | Wallet Signature Method | ⬜ | NOT STARTED |
| 7.5 | Form Switching & State Preservation | ⬜ | NOT STARTED |
| 7.6 | Error Handling | ⬜ | NOT STARTED |
| 7.7 | Success Confirmation | ⬜ | NOT STARTED |
| 7.8 | Responsive Design | ⬜ | NOT STARTED |
| 7.9 | Navigation & Back Button | ⬜ | NOT STARTED |
| 7.10 | Multiple Claims Same Profile | ⬜ | NOT STARTED |

**Phase 7 Target**: 10/10 tests (100%)

---

## Testing Tools & Commands

### Chrome DevTools Inspection

**Network Monitoring**:
1. Open DevTools (F12)
2. Click "Network" tab
3. Filter to "XHR" to see API requests
4. Expand each request to view:
   - Request headers
   - Request body (POST payload)
   - Response status and body

**Database Verification**:
```bash
# Connect to test database
psql $DATABASE_URL

# Check test profiles
SELECT id, displayName, slug, claimedByUserId FROM ecosystem_profile 
WHERE slug IN ('yvonne-xie', 'dr-john-wu', 'moehringen');

# Check submitted claims
SELECT * FROM claim_request 
WHERE ecosystem_profile_id IN (SELECT id FROM ecosystem_profile WHERE slug IN ('yvonne-xie', 'dr-john-wu'))
ORDER BY created_at DESC;
```

### Responsive Testing

**Emulate Mobile in DevTools**:
1. Press F12
2. Press Ctrl+Shift+M (or Cmd+Shift+M on Mac)
3. Select device preset (e.g., iPhone 12)
4. Test form interaction

---

## Known Issues & Workarounds

### Issue: Email Field Styling

**Description**: Email input may have incorrect focus color (not matching design system).

**Workaround**: Check console for warnings; use Tailwind class inspection to verify.

---

## Notes for Next Phase

- **After Phase 7 complete**: Prepare Phase 8 (Claims Management Admin Dashboard)
- **Data dependencies**: Phase 7 creates claim_request records used in Phase 8
- **Email testing**: Email sending is mocked in test config; actual emails won't be sent

---

## Contact & Escalation

If you encounter:
- **API errors**: Check `apps/api/app/api/v1/claims/request/route.ts`
- **Form state issues**: Check component state in `apps/web/app/[locale]/profile/claim/[ecosystem-slug]/page.tsx`
- **Database issues**: Run migrations: `pnpm migrate`

---

**Phase 7 Ready**: ✅ All prerequisites met. Begin testing when approved.
