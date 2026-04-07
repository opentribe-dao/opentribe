# Phase 14: Security & Access Control Testing
**PR #151: Admin App + Claims Management System**

---

## Overview

**Focus:** Security & Access Control — Double-layer admin middleware, permission matrices, claim authorization, authentication session handling

**Goals:**
- Verify admin middleware enforces two-layer access control (role + permission)
- Test claim security (user can't accept/reject claims they don't own)
- Verify auth cookies & session management
- Test organization member permissions
- Validate rate limiting & brute force protection
- Test CORS headers on sensitive endpoints

**Total Tests:** 13
**Prerequisites:**
- Phase 0-13 completed
- All servers running (`pnpm dev`)
- Database seeded with Phase 12 data (W3F Kusama grants/org)
- Apps running on ports: 3000 (web), 3001 (dashboard), 3002 (api), 3003 (admin)

---

## Test Execution

### Category A: Admin Middleware & Authorization (Tests 14.1-14.5)

---

#### Test 14.1: Admin Middleware Rejects Non-Admins
**Objective:** Verify admin routes reject requests from non-admin users

**Steps:**
1. Get user auth token (from web login)
2. Attempt to access admin dashboard: `curl -H "Authorization: Bearer {web_user_token}" http://localhost:3001/`
3. Verify response: Should get 401/403 Unauthorized or redirect to login

**Expected Result:**
- Status: 403 Forbidden OR 401 Unauthorized OR redirect to /auth/sign-in
- Message: "Unauthorized" or "Admin access required"

**Test Label:** 14.1-admin-middleware-rejects-non-admins

---

#### Test 14.2: Admin Middleware Accepts Admin Users
**Objective:** Verify admin routes accept requests from admin users (Super Admin or Admin with claims management role)

**Steps:**
1. Get admin auth token (from admin login with platform admin account)
2. Access admin dashboard: `curl -H "Authorization: Bearer {admin_token}" http://localhost:3003/`
3. Verify response: Should get 200 OK and admin UI renders

**Expected Result:**
- Status: 200 OK
- Admin dashboard loads with claims management section visible

**Test Label:** 14.2-admin-middleware-accepts-admins

---

#### Test 14.3: Double-Layer Middleware Verification
**Objective:** Verify BOTH role + permission checks are enforced

**Steps:**
1. Create user account with limited org member permissions (not admin)
2. Attempt to access `/api/v1/organizations/{orgId}/claims` endpoint
3. Verify request rejected even though user is authenticated

**Expected Result:**
- Status: 403 Forbidden
- Message: "Insufficient permissions" or "Claims management not allowed"

**Test Label:** 14.3-double-layer-middleware

---

#### Test 14.4: Admin Middleware Logs Access Attempts
**Objective:** Verify failed access attempts are logged (audit trail)

**Steps:**
1. Attempt 5 consecutive failed admin login attempts
2. Check application logs for audit entries
3. Verify log contains: timestamp, user attempt, IP, denial reason

**Expected Result:**
- Logs contain 5 failed authentication entries
- Each log entry has: timestamp, user, IP, reason

**Test Label:** 14.4-admin-access-logging

---

#### Test 14.5: Admin Session Timeout
**Objective:** Verify admin sessions expire after inactivity period

**Steps:**
1. Login to admin dashboard
2. Wait for configured timeout (typically 30 mins, or set `SESSION_TIMEOUT_MINUTES` in .env if available)
3. Attempt to access protected route
4. Verify session expired and redirect to login

**Expected Result:**
- After timeout, routes require re-authentication
- Redirect to login page with "Session expired" message

**Test Label:** 14.5-admin-session-timeout

---

### Category B: Claim Authorization & Ownership (Tests 14.6-14.9)

---

#### Test 14.6: Claim Owner Can Review Own Claim
**Objective:** Verify claim creator can view and review their own claim

**Steps:**
1. Login as W3F org member (who created a claim in Phase 11)
2. Navigate to claims dashboard: `GET /api/v1/organizations/{orgId}/claims`
3. Filter to claims owned by this user
4. Verify can see: claim ID, status, created date, submission details

**Expected Result:**
- HTTP 200
- Returns list with at least 1 claim owned by user
- Claim object includes: id, status, submitterEmail, createdAt, updatedAt

**Test Label:** 14.6-claim-owner-can-review

---

#### Test 14.7: Claim Owner Cannot Accept Own Claim
**Objective:** Verify claim creator CANNOT approve their own claim (prevent self-approval)

**Steps:**
1. Login as organization member who created a claim
2. Attempt to POST to `/api/v1/organizations/{orgId}/claims/{claimId}/accept`
3. Verify request rejected with error

**Expected Result:**
- Status: 403 Forbidden or 400 Bad Request
- Message: "Cannot approve own claim" or "Insufficient permissions"

**Test Label:** 14.7-claim-owner-cannot-self-approve

---

#### Test 14.8: Only Assigned Approver Can Accept Claim
**Objective:** Verify only user with "claims_approver" role can accept claims (permission matrix)

**Steps:**
1. Create two org members: User A (no role), User B (claims_approver role)
2. Login as User A, attempt: `POST /api/v1/organizations/{orgId}/claims/{claimId}/accept`
3. Verify rejection
4. Login as User B, attempt same endpoint
5. Verify acceptance succeeds

**Expected Result:**
- User A: 403 Forbidden
- User B: 200 OK + claim status changes to "accepted"

**Test Label:** 14.8-only-approver-can-accept

---

#### Test 14.9: Claim Cross-Organization Isolation
**Objective:** Verify users cannot access/modify claims from other organizations

**Steps:**
1. Create Org A and Org B with separate memberships
2. Login as member of Org A
3. Attempt to access claims of Org B: `GET /api/v1/organizations/{orgB_id}/claims`
4. Verify rejection with 403 Forbidden

**Expected Result:**
- Status: 403 Forbidden
- Message: "Not a member of this organization" or "Access denied"

**Test Label:** 14.9-cross-org-isolation

---

### Category C: Authentication & Session Security (Tests 14.10-14.12)

---

#### Test 14.10: Auth Cookie Security Headers
**Objective:** Verify auth cookies have security flags (HttpOnly, Secure, SameSite)

**Steps:**
1. Login to admin dashboard
2. Capture Set-Cookie header: `curl -i -X POST http://localhost:3003/api/auth/sign-in -d "..."` (with credentials)
3. Verify cookie flags present

**Expected Result:**
- Cookie includes: `HttpOnly`, `Secure` (in production), `SameSite=Lax` or `SameSite=Strict`
- Example: `Set-Cookie: auth_token=...; HttpOnly; SameSite=Lax; Path=/`

**Test Label:** 14.10-auth-cookie-security

---

#### Test 14.11: CORS Headers on Sensitive Endpoints
**Objective:** Verify CORS headers restrict cross-origin requests to sensitive endpoints

**Steps:**
1. GET `/api/v1/organizations/{orgId}/claims` from different origin
2. Check CORS headers: `Access-Control-Allow-Origin`
3. Verify either missing (default deny) OR restricted to whitelisted origins

**Expected Result:**
- CORS header either absent (deny all) OR restricted to: `localhost:3000`, `localhost:3001`, `localhost:3003`
- No `Access-Control-Allow-Origin: *` on sensitive endpoints

**Test Label:** 14.11-cors-security

---

#### Test 14.12: Rate Limiting on Auth Endpoints
**Objective:** Verify auth endpoints are rate limited (prevent brute force)

**Steps:**
1. Attempt 11 consecutive login attempts with wrong password in 60 seconds
2. Check 11th attempt response
3. Verify rate limit enforcement (429 Too Many Requests or temporary lockout)

**Expected Result:**
- First 10 attempts: 401 Unauthorized
- 11th+ attempts: 429 Too Many Requests OR temp IP lockout (5-15 min timeout)

**Test Label:** 14.12-rate-limiting

---

### Category D: Organization & Role-Based Access (Test 14.13)

---

#### Test 14.13: Role-Based Permission Matrix
**Objective:** Verify complete permission matrix: which roles can do what

**Steps:**

| Role | Can View Claims? | Can Accept Claims? | Can Reject Claims? | Can Reset Winners? | Result |
|------|-----|-----|-----|-----|:---:|
| Platform Admin (Super Admin) | Yes | Yes | Yes | Yes | Should all be ✅ |
| Org Owner | Yes | Yes | Yes | Yes | Should all be ✅ |
| Claims Approver | Yes | Yes | Yes | No | First 3 ✅, last ❌ |
| Org Member (basic) | No | No | No | No | All ❌ |
| Non-Member User | No | No | No | No | All ❌ |

**Test Instructions:**
1. Create/select test org with 5 different role users
2. For each role, test 4 endpoints:
   - `GET /api/v1/organizations/{orgId}/claims` (view)
   - `POST /api/v1/organizations/{orgId}/claims/{claimId}/accept` (accept)
   - `POST /api/v1/organizations/{orgId}/claims/{claimId}/reject` (reject)
   - `POST /api/v1/bounties/{bountyId}/winners/reset` (reset)
3. Document results in evidence file

**Expected Result:**
- Permissions matrix matches table above
- All "✅" operations return 200-201
- All "❌" operations return 403 Forbidden

**Test Label:** 14.13-rbac-permission-matrix

---

## Evidence Inventory

**Required Evidence Files (13 total):**

```
.pr151-test-assets/screenshots/phase-14/
├── 14.1-admin-middleware-rejects.txt       (curl response, 403 expected)
├── 14.2-admin-middleware-accepts.txt       (curl response, 200 expected)
├── 14.3-double-layer-middleware.txt        (curl response, 403 expected)
├── 14.4-admin-access-logging.txt           (log entries from app logs)
├── 14.5-admin-session-timeout.txt          (session timeout verification)
├── 14.6-claim-owner-can-review.txt         (claim list API response)
├── 14.7-claim-owner-cannot-self-approve.txt (rejection response, 403 expected)
├── 14.8-only-approver-can-accept.txt       (user A: 403, user B: 200)
├── 14.9-cross-org-isolation.txt            (403 when accessing other org)
├── 14.10-auth-cookie-security.txt          (Set-Cookie headers)
├── 14.11-cors-security.txt                 (CORS header verification)
├── 14.12-rate-limiting.txt                 (429 Too Many Requests)
└── 14.13-rbac-permission-matrix.txt        (complete permission matrix results)
```

---

## Execution Workflow

### Step 1: Pre-Test Checklist
- [ ] All servers running: web (3000), dashboard (3001), api (3002), admin (3003)
- [ ] Database seeded (Phase 12 data present)
- [ ] PostgreSQL connected and accessible
- [ ] Test user accounts created (if needed)
- [ ] Clipboard ready for test outputs

### Step 2: Run Tests in Sequence
1. Tests 14.1-14.5 (Admin Middleware) — ~15 mins
2. Tests 14.6-14.9 (Claim Authorization) — ~20 mins
3. Tests 14.10-14.12 (Auth Security) — ~15 mins
4. Test 14.13 (Permission Matrix) — ~25 mins

**Total Execution Time: ~75 minutes**

### Step 3: Capture Evidence
- Copy curl responses to evidence files
- Copy log entries to evidence files
- Document permission matrix results

### Step 4: Update Checklist
- Mark each test ✅ PASS or ⏳ PENDING (if blocked)
- Note any findings or issues
- Commit results with Phase 14 tag

---

## Known Blockers & Assumptions

**Assumptions:**
- Admin app (port 3003) is fully deployed
- Better Auth sessions working correctly
- PostgreSQL at localhost:5432 with opentribe database
- Rate limiting middleware installed (if not, skip test 14.12)

**Potential Blockers:**
- Admin middleware not yet implemented → Mark tests 14.1-14.5 as ⏳ PENDING
- Permission matrix not yet fully implemented → Mark test 14.13 as ⏳ PENDING (test what's available)
- Session timeout not configured → Skip test 14.5, note as not implemented

---

## Success Criteria

**PASS:** All 13/13 tests executed and pass (or clearly documented as not yet implemented)
- Minimum passing tests: 8/13 for partial pass
- All security headers present and correct
- Permission matrix mostly implemented

**Notes for Checklist:**
- If any test blocked, document blocker clearly (missing feature, not yet implemented, etc.)
- If test partially passes (some conditions met, some not), split evidence into multiple sections
- Rate limiting test (14.12) can be skipped if rate limiting middleware not installed (non-critical)

---

## Additional Testing Tips

**Using curl with Admin Cookies:**
```bash
# Get cookie from login, then use in subsequent requests
curl -c /tmp/cookies.txt -X POST http://localhost:3003/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"..."}'

# Use stored cookie for authenticated requests
curl -b /tmp/cookies.txt http://localhost:3003/api/admin/protected-route
```

**Checking App Logs:**
```bash
# Terminal running pnpm dev will show logs
# Or check if logging to file: tail -f apps/api/.logs/app.log
```

**Database Query Verification:**
```bash
psql $DATABASE_URL -c "SELECT id, email, role FROM users WHERE email LIKE 'admin%' LIMIT 5;"
```

---

## Related Documentation

- **PR151_TEST_CHECKLIST.md** — Main progress tracker (update Section 14)
- **PHASE_14_PROMPT_EXECUTED.md** — Will be created after execution with full results
- **Better Auth Security Docs** — Reference for cookie security implementation
- *Blocking Issues*: None from prior phases
