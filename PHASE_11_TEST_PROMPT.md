# PHASE 11: ORGANIZATION CLAIM SYSTEM — TEST PROMPT

**Objective:** Test the organization claim flow (`POST /api/v1/organizations/{organizationId}/claim`) with complete test coverage of all edge cases, validation, and business logic.

**API Endpoint:** `http://localhost:3002/api/v1/organizations/{organizationId}/claim`

**Testing Method:** cURL API tests + Chrome DevTools for UI verification (if applicable)

---

## CRITICAL CONTEXT

### Organization Claims vs Profile Claims

| Aspect | Profile Claims | Organization Claims |
|--------|---|---|
| **Table** | `ClaimRequest` | `Invitation` |
| **Status Values** | `EMAIL_VERIFICATION`, `VERIFIED`, `REJECTED` | `claim_pending` |
| **Auto-Approval** | ✅ Some methods auto-approve (GITHUB_OAUTH, WALLET_SIGNATURE) | ❌ **NEVER auto-approve — admin review required** |
| **Expiry** | 7 days | **30 days** |
| **Role** | N/A | `"owner"` (hardcoded) |
| **Inviter** | User who claimed | Self-referential: `inviterId = userId` |
| **Proof of Ownership** | Method-specific (email code, OAuth, wallet sig) | **Free-form text: 10-2000 characters** |

### Expected Behavior

1. **User submits org claim** → Creates `Invitation` with `status: "claim_pending"`
2. **Admin reviews in admin panel** → Updates status to `"accepted"` or `"rejected"`
3. **If accepted** → User becomes member with `role: "owner"`
4. **Claim expires after 30 days** → Admin cannot process after expiry

---

## TEST REQUIREMENTS

### Prerequisites

- ✅ Servers running: `pnpm dev` (all 3 apps: web, dashboard, api)
- ✅ Logged-in user (can use same session from Phase 10 or login as regular user)
- ✅ Test organization (use existing: "Web3 Foundation", id = `{org_id}`, or create new)
- ✅ cURL or Postman for API testing
- ✅ Access to Admin Panel (localhost:3003) to verify invitation appears

### Test Data Setup

**For testing, you need:**
1. **Test user account** — Any authenticated user (e.g., from Phase 10 signup flow)
2. **Test organization** — Use "Web3 Foundation" or any existing org ID
3. **Session token** — From authenticated login (Bearer token or cookie)

---

## TEST CASES

### Test 11.1: Successful Org Claim Submission

**Test Steps:**
1. User logged in ✅
2. POST to `/api/v1/organizations/{org_id}/claim`
3. Request body: `{ "proof": "We own this domain: example.com and have team members who can verify" }`

**Expected Response:**
```json
{
  "claimId": "invc_xxxxxxxxxxxxx",
  "status": "pending",
  "message": "Your organization claim has been submitted for admin review. You will be notified when it is processed."
}
```

**Status Code:** 201 or 200

**Database Check:**
- Query `Invitation` table
- Find record: `email = user.email`, `organizationId = {org_id}`, `status = "claim_pending"`
- Verify: `expiresAt = now + 30 days`, `role = "owner"`, `inviterId = userId`

**Evidence to Capture:**
- Response JSON (save as `11.1-org-claim-success.json`)
- Database query result (verify invitations table)
- Admin panel screenshot showing new invitation in queue

---

### Test 11.2: Proof Text Validation — Too Short

**Test Steps:**
1. POST to `/api/v1/organizations/{org_id}/claim`
2. Request body: `{ "proof": "short" }` (5 characters)

**Expected Response:**
```json
{
  "fieldErrors": {
    "proof": ["Please provide a detailed description of your proof of ownership"]
  }
}
```

**Status Code:** 400

**Evidence to Capture:**
- Response JSON (save as `11.2-proof-too-short.json`)

---

### Test 11.3: Proof Text Validation — Too Long

**Test Steps:**
1. POST to `/api/v1/organizations/{org_id}/claim`
2. Request body: `{ "proof": "{2001 characters of text}" }`

**Expected Response:**
```json
{
  "fieldErrors": {
    "proof": ["String must contain at most 2000 character(s)"]
  }
}
```

**Status Code:** 400

**Evidence to Capture:**
- Response JSON (save as `11.3-proof-too-long.json`)

---

### Test 11.4: Proof Text Validation — Exactly Valid (Edge Cases)

**Test Steps A: Minimum valid (10 chars)**
1. POST to `/api/v1/organizations/{org_id}/claim`
2. Request body: `{ "proof": "1234567890" }`

**Expected:** 200/201, succeeds

**Test Steps B: Maximum valid (2000 chars)**
1. POST to `/api/v1/organizations/{org_id}/claim`
2. Request body: `{ "proof": "{2000 character string}" }`

**Expected:** 200/201, succeeds

**Evidence to Capture:**
- Both responses (save as `11.4a-proof-10chars.json`, `11.4b-proof-2000chars.json`)

---

### Test 11.5: Missing Proof Field

**Test Steps:**
1. POST to `/api/v1/organizations/{org_id}/claim`
2. Request body: `{}` (empty object)

**Expected Response:**
```json
{
  "fieldErrors": {
    "proof": ["Required"]
  }
}
```

**Status Code:** 400

**Evidence to Capture:**
- Response JSON (save as `11.5-missing-proof.json`)

---

### Test 11.6: User Already a Member — Prevent Claim

**Test Steps:**
1. Make user a member of organization first (via admin panel or database)
2. POST to `/api/v1/organizations/{org_id}/claim`
3. Request body: `{ "proof": "We own this" }`

**Expected Response:**
```json
{
  "error": "You are already a member of this organization"
}
```

**Status Code:** 409 (Conflict)

**Evidence to Capture:**
- Response JSON (save as `11.6-already-member.json`)

---

### Test 11.7: Duplicate Pending Claim — Prevent Second Claim

**Test Steps:**
1. User submits org claim successfully (Test 11.1)
2. Same user submits claim again for same org
3. Request body: `{ "proof": "Second attempt" }`

**Expected Response:**
```json
{
  "error": "You already have a pending claim for this organization"
}
```

**Status Code:** 409 (Conflict)

**Evidence to Capture:**
- Response JSON (save as `11.7-duplicate-claim.json`)
- Verify only ONE invitation record exists in DB for (email, org, status=claim_pending)

---

### Test 11.8: Organization Not Found

**Test Steps:**
1. POST to `/api/v1/organizations/{non-existent-id}/claim`
2. Request body: `{ "proof": "We own this" }`

**Expected Response:**
```json
{
  "error": "Organization not found"
}
```

**Status Code:** 404

**Evidence to Capture:**
- Response JSON (save as `11.8-org-not-found.json`)

---

### Test 11.9: Unauthenticated Request

**Test Steps:**
1. POST to `/api/v1/organizations/{org_id}/claim` **without session token**
2. Request body: `{ "proof": "We own this" }`

**Expected Response:**
```json
{
  "error": "Unauthorized"
}
```

**Status Code:** 401

**Evidence to Capture:**
- Response JSON (save as `11.9-unauthorized.json`)

---

### Test 11.10: Invalid Request Body (Malformed JSON)

**Test Steps:**
1. POST to `/api/v1/organizations/{org_id}/claim`
2. Request body: `{ invalid json }`

**Expected Response:**
```json
{
  "error": "Failed to submit organization claim"
}
```

**Status Code:** 400 or 500

**Evidence to Capture:**
- Response JSON (save as `11.10-malformed-json.json`)

---

### Test 11.11: Claim Expiry — 30 Days

**Test Steps:**
1. Submit org claim successfully
2. Check `Invitation` table: `expiresAt` field
3. Calculate: `expiresAt - now`

**Expected:** Approximately 30 days (2,592,000 seconds ± 60 seconds)

**Database Query:**
```sql
SELECT id, organizationId, email, status, expiresAt, 
  TIMESTAMPDIFF(SECOND, NOW(), expiresAt) AS seconds_until_expiry
FROM invitation 
WHERE email = '{user_email}' AND organizationId = '{org_id}' AND status = 'claim_pending';
```

**Expected:** `seconds_until_expiry` ≈ 2,592,000 (30 * 24 * 60 * 60)

**Evidence to Capture:**
- Database query result (save as `11.11-expiry-check.json`)

---

### Test 11.12: Claim Appears in Admin Panel

**Test Steps:**
1. Submit org claim via API (Test 11.1)
2. Open Admin Panel: `http://localhost:3003`
3. Navigate to Claims or Invitations section
4. Search for organization and user
5. Verify invitation shows as `claim_pending` status

**Expected:**
- Invitation appears in admin queue
- Status shows `"claim_pending"`
- Can see claim details: organization, user email, proof text, expiry date
- Admin has buttons to approve or reject

**Evidence to Capture:**
- Screenshot of admin panel showing new claim (save as `11.12-admin-panel-claim.png`)

---

### Test 11.13: Admin Approves Claim (Integration Test)

**Test Steps:**
1. Submit org claim via API
2. Go to Admin Panel
3. Find the pending claim
4. Click "Approve" button
5. Verify user is now member

**Expected:**
- `Invitation` status changes from `"claim_pending"` to `"accepted"`
- `Member` record is created linking user to organization
- User role is `"owner"`
- Admin panel shows confirmation message

**Evidence to Capture:**
- Admin panel screenshot after approval (save as `11.13-claim-approved.png`)
- Database query showing new Member record

---

### Test 11.14: Admin Rejects Claim (Integration Test)

**Test Steps:**
1. Submit org claim via API
2. Go to Admin Panel
3. Find the pending claim
4. Click "Reject" button with optional reason
5. Verify invitation is rejected

**Expected:**
- `Invitation` status changes from `"claim_pending"` to `"rejected"`
- No `Member` record created
- Admin panel shows confirmation message
- User cannot see the claim anymore

**Evidence to Capture:**
- Admin panel screenshot after rejection (save as `11.14-claim-rejected.png`)
- Database query showing `status = "rejected"`

---

### Test 11.15: Claim Proof Text Appears in Admin Panel

**Test Steps:**
1. Submit org claim with specific proof: `"We are the team at Company Inc, founded 2020, located at example.com"`
2. Go to Admin Panel
3. Open claim details

**Expected:**
- Full proof text is visible to admin
- Admin can read and verify ownership claim
- Proof text is not truncated

**Evidence to Capture:**
- Screenshot showing full proof text (save as `11.15-proof-text-admin.png`)

---

## EXECUTION WORKFLOW

### Before You Start

1. **Ensure servers running:**
   ```bash
   # In separate terminals:
   pnpm dev              # Starts web (3000), dashboard (3001), api (3002), admin (3003)
   ```

2. **Get a test session token:**
   - Option A: Login to `localhost:3000` → Extract session cookie from DevTools
   - Option B: Login to `localhost:3001` (dashboard) → Same session
   - Option C: Use existing session from Phase 10

3. **Identify test organization:**
   - Use "Web3 Foundation" (likely `id = "org_xyz"`)
   - Or create a test org first

4. **Identify test user:**
   - Use any authenticated user email
   - Record the userId for cross-checks

### Test Execution Steps

**For each test case:**

1. **Run the cURL command** (or Postman)
2. **Capture the response** → Save JSON to `.pr151-test-assets/screenshots/phase-11/{test_number}-{name}.json`
3. **Check database** (if applicable) → Run SQL query, verify result
4. **Take screenshot** (if applicable) → Save to `.pr151-test-assets/screenshots/phase-11/{test_number}-{name}.png`
5. **Log findings** → Note any discrepancies, errors, or unexpected behavior

### Testing Tools

**Option 1: cURL (Recommended)**
```bash
curl -X POST http://localhost:3002/api/v1/organizations/{org_id}/claim \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token={session_token}" \
  -d '{"proof":"We own this organization"}' \
  -w "\n%{http_code}\n"
```

**Option 2: Chrome DevTools (Console)**
```javascript
fetch('http://localhost:3002/api/v1/organizations/{org_id}/claim', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ proof: 'We own this organization' })
}).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)))
```

---

## EXPECTED RESULTS SUMMARY

| Test # | Scenario | Expected Status | Pass/Fail |
|--------|----------|-----------------|-----------|
| 11.1 | Successful claim | 201/200 | ✅ |
| 11.2 | Proof too short | 400 | ✅ |
| 11.3 | Proof too long | 400 | ✅ |
| 11.4 | Edge case (10/2000 chars) | 201/200 | ✅ |
| 11.5 | Missing proof | 400 | ✅ |
| 11.6 | Already member | 409 | ✅ |
| 11.7 | Duplicate claim | 409 | ✅ |
| 11.8 | Org not found | 404 | ✅ |
| 11.9 | Unauthenticated | 401 | ✅ |
| 11.10 | Malformed JSON | 400/500 | ✅ |
| 11.11 | Expiry 30 days | ✓ verify DB | ✅ |
| 11.12 | Admin panel shows claim | ✓ screenshot | ✅ |
| 11.13 | Admin approves claim | ✓ member created | ✅ |
| 11.14 | Admin rejects claim | ✓ invitation rejected | ✅ |
| 11.15 | Proof visible to admin | ✓ screenshot | ✅ |

---

## DATABASE QUERIES FOR VERIFICATION

### Check invitation created:
```sql
SELECT id, organizationId, email, status, role, expiresAt, inviterId 
FROM invitation 
WHERE organizationId = '{org_id}' AND email = '{user_email}' AND status = 'claim_pending';
```

### Check member created (after approval):
```sql
SELECT id, organizationId, userId, role, createdAt 
FROM member 
WHERE organizationId = '{org_id}' AND userId = '{user_id}';
```

### Check claim was rejected:
```sql
SELECT id, organizationId, email, status 
FROM invitation 
WHERE organizationId = '{org_id}' AND email = '{user_email}' AND status = 'rejected';
```

---

## EVIDENCE COLLECTION

**Create directory:**
```bash
mkdir -p .pr151-test-assets/screenshots/phase-11
```

**Save all responses:**
- `11.1-org-claim-success.json`
- `11.2-proof-too-short.json`
- `11.3-proof-too-long.json`
- `11.4a-proof-10chars.json`
- `11.4b-proof-2000chars.json`
- `11.5-missing-proof.json`
- `11.6-already-member.json`
- `11.7-duplicate-claim.json`
- `11.8-org-not-found.json`
- `11.9-unauthorized.json`
- `11.10-malformed-json.json`
- `11.11-expiry-check.json`

**Save all screenshots:**
- `11.12-admin-panel-claim.png` (admin panel with pending claim)
- `11.13-claim-approved.png` (admin panel after approval)
- `11.14-claim-rejected.png` (admin panel after rejection)
- `11.15-proof-text-admin.png` (full proof text visible)

---

## SUCCESS CRITERIA

✅ **Phase 11 is PASS if:**
1. All 15 test cases execute without errors
2. All responses match expected status codes
3. Validation rules are enforced (10-2000 char proof)
4. Duplicate claims are prevented (409)
5. Member already check prevents claim (409)
6. 30-day expiry is correctly set
7. Admin panel displays claims correctly
8. Admin can approve/reject claims
9. Approved claims create member records

❌ **Phase 11 is FAIL if:**
- Any API endpoint returns unexpected status code
- Validation is not enforced
- Duplicate claims are allowed
- Claims don't appear in admin panel
- Admin approval/rejection doesn't work

---

## NOTES FOR TESTER

1. **Session Token:** You may need to re-extract the session token if it expires. If you see 401 errors, refresh your login.

2. **Test Organization:** If using same org multiple times, create new orgs for each test cycle to avoid state conflicts.

3. **Admin Access:** Make sure you're logged in as admin (superadmin) to access the admin panel.

4. **Database Queries:** Use your preferred SQL client (e.g., Adminer, DBeaver, or psql) to verify database state.

5. **Timing:** Tests 11.11 (expiry) will verify 30-day timing. Expect ~2,592,000 seconds ± 60 seconds.

6. **Proof Text:** Store the exact proof text you submitted for reference in admin panel verification.

---

## AFTER TESTING

Once complete:
1. Update `PR151_TEST_CHECKLIST.md` with Phase 11 results
2. Mark each test ✅ or ⚠️ with findings
3. Note any bugs or limitations
4. Commit with message: `test(phase-11): Organization claim system complete`

