# Phase 10: Admin Endpoints Testing Prompt

**Scope**: Comprehensive testing of all admin API endpoints with superadmin authentication.

**Prerequisites**:
- All servers running via `pnpm dev` (web:3000, dashboard:3001, api:3002, docs:3004, admin:3005)
- Admin app at http://localhost:3005
- API at http://localhost:3002
- Chrome DevTools open for capturing session cookies and testing

**Authentication Setup**:
- Admin endpoints require superadmin session via `BETTER_AUTH_SECRET`
- Session cookie captured from admin app after login
- Cookie format: `auth_session` or `auth.session` (check admin app cookies)
- All requests: `Cookie: {auth_session}` header

**Base URL**: `http://localhost:3002/api/v1/admin`

---

## Test 10.1: Admin Stats Endpoint

**Endpoint**: `GET /api/v1/admin/stats`

**Purpose**: Retrieve platform-wide statistics available only to superadmins.

### Prerequisites
- Superadmin session cookie captured

### Steps
1. **Without Auth**: `curl -s http://localhost:3002/api/v1/admin/stats | jq '.'`
   - Expected: 403 "Unauthorized. Superadmin access required."
2. **With Auth**: Add session cookie to request
   - `curl -s -H "Cookie: {session_cookie}" http://localhost:3002/api/v1/admin/stats | jq '.'`

### Expected Response
```json
{
  "totalUsers": <number>,
  "totalOrganizations": <number>,
  "totalGrants": <number>,
  "totalBounties": <number>,
  "totalEcosystemProfiles": <number>,
  "pendingClaims": <number>,
  "totalImportJobs": <number>
}
```

### Success Criteria
- [ ] Returns 200 OK with superadmin session
- [ ] Returns 403 without auth
- [ ] All fields present and numeric
- [ ] Values match seed data (if known)

### Evidence to Capture
- Screenshot of successful response with cookies visible
- JSON response file saved to `.pr151-test-assets/screenshots/phase-10/10.1-admin-stats.json`

---

## Test 10.2: Admin Authorization

**Purpose**: Verify authentication and authorization gates on admin endpoints.

### Test 10.2.1: No Session (Unauthenticated)

**Endpoint**: `GET /api/v1/admin/users` (any admin endpoint)

**Step**: `curl -s http://localhost:3002/api/v1/admin/users | jq '.'`

**Expected**:
- Status: 403 Forbidden
- Body: `{ "error": "Unauthorized. Superadmin access required." }`

**Success Criteria**
- [ ] Returns 403
- [ ] Error message present

### Test 10.2.2: Non-Superadmin Session

**Step**:
1. Log in to dashboard (regular user) to get session cookie
2. Use that cookie on admin endpoint: `curl -s -H "Cookie: {user_session}" http://localhost:3002/api/v1/admin/users`

**Expected**:
- Status: 403 Forbidden
- Message: "Unauthorized. Superadmin access required."

**Success Criteria**
- [ ] Non-superadmin cannot access admin endpoints
- [ ] Error returned with 403

### Test 10.2.3: Superadmin Session

**Step**:
1. Log in to admin app (superadmin)
2. Capture session cookie from browser DevTools (Application → Cookies → localhost:3005)
3. Use that cookie: `curl -s -H "Cookie: {admin_session}" http://localhost:3002/api/v1/admin/users | jq '.'`

**Expected**:
- Status: 200 OK
- Response contains paginated user list

**Success Criteria**
- [ ] Superadmin can access admin endpoints
- [ ] Returns data with 200

---

## Test 10.3: Admin Users Endpoint

**Endpoint**: `GET /api/v1/admin/users` (list), `GET /api/v1/admin/users/{id}` (detail), `PATCH /api/v1/admin/users/{id}` (update)

### Test 10.3.1: List Users

**Step**: `curl -s -H "Cookie: {admin_session}" "http://localhost:3002/api/v1/admin/users?page=1&limit=10" | jq '.'`

**Expected Response**:
```json
{
  "data": [
    {
      "id": "<string>",
      "email": "<string>",
      "name": "<string>",
      "role": "USER|SUPERADMIN",
      "banned": <boolean>,
      "createdAt": "<ISO-8601>",
      "updatedAt": "<ISO-8601>"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": <number>,
    "pages": <number>
  }
}
```

**Success Criteria**
- [ ] Returns 200
- [ ] `data` array populated
- [ ] Each user has: id, email, name, role, banned, timestamps
- [ ] Pagination object present

**Evidence**: Save response to `.pr151-test-assets/screenshots/phase-10/10.3.1-list-users.json`

### Test 10.3.2: Get User Detail

**Step**: Pick a user ID from the list response, then:
`curl -s -H "Cookie: {admin_session}" "http://localhost:3002/api/v1/admin/users/{userId}" | jq '.'`

**Expected**: Single user object with all fields

**Success Criteria**
- [ ] Returns user details
- [ ] Status 200

### Test 10.3.3: Update User Role (PATCH)

**Step**: 
```bash
curl -s -X PATCH \
  -H "Cookie: {admin_session}" \
  -H "Content-Type: application/json" \
  -d '{"role": "SUPERADMIN"}' \
  "http://localhost:3002/api/v1/admin/users/{userId}"
```

**Expected**: Updated user object with new role

**Success Criteria**
- [ ] Returns 200
- [ ] User role updated
- [ ] Response contains updated user

**Known Issues**:
- ⚠️ **P4-1**: Role change may fail silently (need to verify logging)

---

## Test 10.4: Admin Organizations Endpoint

**Endpoint**: `GET /api/v1/admin/organizations`, `POST /api/v1/admin/organizations`, `GET /api/v1/admin/organizations/{id}`, `PATCH /api/v1/admin/organizations/{id}`

### Test 10.4.1: List Organizations

**Step**: `curl -s -H "Cookie: {admin_session}" "http://localhost:3002/api/v1/admin/organizations?page=1&limit=10" | jq '.'`

**Expected**:
```json
{
  "data": [
    {
      "id": "<string>",
      "name": "<string>",
      "slug": "<string>",
      "logo": "<string|null>",
      "bio": "<string|null>",
      "website": "<string|null>",
      "twitter": "<string|null>",
      "discord": "<string|null>",
      "status": "ACTIVE|INACTIVE",
      "createdAt": "<ISO-8601>",
      "updatedAt": "<ISO-8601>"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": <number>, "pages": <number> }
}
```

**Success Criteria**
- [ ] Returns 200
- [ ] Organizations list populated
- [ ] Each org has id, name, slug, status, timestamps

**Evidence**: Save to `.pr151-test-assets/screenshots/phase-10/10.4.1-list-orgs.json`

### Test 10.4.2: Create Organization

**Step**:
```bash
curl -s -X POST \
  -H "Cookie: {admin_session}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin Org",
    "slug": "test-admin-org-'$(date +%s)'",
    "bio": "Created by Phase 10 admin test",
    "website": "https://example.com",
    "status": "ACTIVE"
  }' \
  "http://localhost:3002/api/v1/admin/organizations"
```

**Expected**: Created organization object with id

**Success Criteria**
- [ ] Returns 200 or 201
- [ ] Org created with returned ID
- [ ] All fields set correctly

### Test 10.4.3: Get Organization Detail

**Step**: `curl -s -H "Cookie: {admin_session}" "http://localhost:3002/api/v1/admin/organizations/{orgId}" | jq '.'`

**Expected**: Single organization object

**Success Criteria**
- [ ] Returns organization details
- [ ] All fields present

### Test 10.4.4: Update Organization

**Step**:
```bash
curl -s -X PATCH \
  -H "Cookie: {admin_session}" \
  -H "Content-Type: application/json" \
  -d '{"bio": "Updated bio from admin test"}' \
  "http://localhost:3002/api/v1/admin/organizations/{orgId}"
```

**Expected**: Updated organization object

**Success Criteria**
- [ ] Returns 200
- [ ] Org bio updated

---

## Test 10.5: Admin Claims Endpoint

**Endpoint**: `GET /api/v1/admin/claims`, `GET /api/v1/admin/claims/{id}`, `PATCH /api/v1/admin/claims/{id}`

**Purpose**: Review and approve/reject ecosystem profile claims.

### Test 10.5.1: List Claims

**Step**: `curl -s -H "Cookie: {admin_session}" "http://localhost:3002/api/v1/admin/claims?status=PENDING&page=1&limit=10" | jq '.'`

**Expected**:
```json
{
  "data": [
    {
      "id": "<string>",
      "userId": "<string>",
      "ecosystemProfileId": "<string>",
      "method": "WALLET_SIGNATURE|EMAIL_VERIFICATION|GITHUB_OAUTH",
      "status": "PENDING|VERIFIED|REJECTED|EXPIRED",
      "createdAt": "<ISO-8601>",
      "reviewedBy": "<string|null>",
      "reviewNotes": "<string|null>"
    }
  ],
  "pagination": { ... }
}
```

**Success Criteria**
- [ ] Returns 200
- [ ] Claims list populated
- [ ] Filter by status works (PENDING visible)

**Evidence**: Save to `.pr151-test-assets/screenshots/phase-10/10.5.1-list-claims.json`

### Test 10.5.2: Get Claim Detail

**Step**: Pick a PENDING claim, then:
`curl -s -H "Cookie: {admin_session}" "http://localhost:3002/api/v1/admin/claims/{claimId}" | jq '.'`

**Expected**: Single claim object with all fields

**Success Criteria**
- [ ] Returns claim details
- [ ] Status 200

### Test 10.5.3: Approve Claim (PATCH)

**Step**:
```bash
curl -s -X PATCH \
  -H "Cookie: {admin_session}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "VERIFIED",
    "reviewNotes": "Approved by Phase 10 admin test"
  }' \
  "http://localhost:3002/api/v1/admin/claims/{claimId}"
```

**Expected**: Claim status updated to VERIFIED

**Success Criteria**
- [ ] Returns 200
- [ ] Claim status changed to VERIFIED
- [ ] reviewedBy set to admin user ID
- [ ] reviewNotes saved

### Test 10.5.4: Reject Claim (PATCH)

**Step**:
```bash
curl -s -X PATCH \
  -H "Cookie: {admin_session}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "REJECTED",
    "reviewNotes": "Rejected by Phase 10 admin test"
  }' \
  "http://localhost:3002/api/v1/admin/claims/{claimId}"
```

**Expected**: Claim status updated to REJECTED

**Success Criteria**
- [ ] Returns 200
- [ ] Claim status changed to REJECTED
- [ ] reviewNotes saved

---

## Test 10.6: Admin Ecosystem Profiles Endpoint

**Endpoint**: `GET /api/v1/admin/ecosystem-profiles`, `GET /api/v1/admin/ecosystem-profiles/{id}`, `DELETE /api/v1/admin/ecosystem-profiles/{id}`

### Test 10.6.1: List Ecosystem Profiles

**Step**: `curl -s -H "Cookie: {admin_session}" "http://localhost:3002/api/v1/admin/ecosystem-profiles?page=1&limit=10" | jq '.'`

**Expected**: Paginated list of ecosystem profiles

**Success Criteria**
- [ ] Returns 200
- [ ] Profiles list populated with id, platform, handle, createdAt

**Evidence**: Save to `.pr151-test-assets/screenshots/phase-10/10.6.1-list-profiles.json`

### Test 10.6.2: Get Profile Detail

**Step**: `curl -s -H "Cookie: {admin_session}" "http://localhost:3002/api/v1/admin/ecosystem-profiles/{profileId}" | jq '.'`

**Expected**: Single profile object

**Success Criteria**
- [ ] Returns profile with all fields

### Test 10.6.3: Delete Profile

**Step**: `curl -s -X DELETE -H "Cookie: {admin_session}" "http://localhost:3002/api/v1/admin/ecosystem-profiles/{profileId}"`

**Expected**: 200 with deletion confirmation or empty response

**Success Criteria**
- [ ] Returns 200
- [ ] Profile deleted from database

---

## Test 10.7: Admin Grants Endpoint

**Endpoint**: `GET /api/v1/admin/grants`, `GET /api/v1/admin/grants/{id}`

### Test 10.7.1: List Grants

**Step**: `curl -s -H "Cookie: {admin_session}" "http://localhost:3002/api/v1/admin/grants?page=1&limit=10" | jq '.'`

**Expected**: Paginated list of grants with ids, titles, funding, status

**Success Criteria**
- [ ] Returns 200
- [ ] Grants populated

**Evidence**: Save to `.pr151-test-assets/screenshots/phase-10/10.7.1-list-grants.json`

### Test 10.7.2: Get Grant Detail

**Step**: `curl -s -H "Cookie: {admin_session}" "http://localhost:3002/api/v1/admin/grants/{grantId}" | jq '.'`

**Expected**: Single grant object with all fields

**Success Criteria**
- [ ] Returns 200
- [ ] All grant fields present

---

## Test 10.8: Admin Bounties Endpoint

**Endpoint**: `GET /api/v1/admin/bounties`, `GET /api/v1/admin/bounties/{id}`

### Test 10.8.1: List Bounties

**Step**: `curl -s -H "Cookie: {admin_session}" "http://localhost:3002/api/v1/admin/bounties?page=1&limit=10" | jq '.'`

**Expected**: Paginated list of bounties

**Success Criteria**
- [ ] Returns 200
- [ ] Bounties populated

**Evidence**: Save to `.pr151-test-assets/screenshots/phase-10/10.8.1-list-bounties.json`

### Test 10.8.2: Get Bounty Detail

**Step**: `curl -s -H "Cookie: {admin_session}" "http://localhost:3002/api/v1/admin/bounties/{bountyId}" | jq '.'`

**Expected**: Single bounty object

**Success Criteria**
- [ ] Returns 200

---

## Test 10.9: Admin Imports Endpoint

**Endpoint**: `GET /api/v1/admin/imports`, `GET /api/v1/admin/imports/{id}`

### Test 10.9.1: List Import Jobs

**Step**: `curl -s -H "Cookie: {admin_session}" "http://localhost:3002/api/v1/admin/imports?page=1&limit=10" | jq '.'`

**Expected**: List of import jobs with status, progress, errors

**Success Criteria**
- [ ] Returns 200
- [ ] If imports exist, show status

**Evidence**: Save to `.pr151-test-assets/screenshots/phase-10/10.9.1-list-imports.json`

### Test 10.9.2: Get Import Job Detail

**Step**: If imports exist:
`curl -s -H "Cookie: {admin_session}" "http://localhost:3002/api/v1/admin/imports/{importId}" | jq '.'`

**Expected**: Single import job with details

**Success Criteria**
- [ ] Returns 200

---

## Test Summary

| Test # | Description | Status | Notes |
| ------ | ----------- | ------ | ----- |
| 10.1 | Admin Stats | ⬜ | - |
| 10.2.1 | Auth: No Session | ⬜ | - |
| 10.2.2 | Auth: Non-Superadmin | ⬜ | - |
| 10.2.3 | Auth: Superadmin | ⬜ | - |
| 10.3.1 | Users: List | ⬜ | - |
| 10.3.2 | Users: Detail | ⬜ | - |
| 10.3.3 | Users: Update | ⬜ | - |
| 10.4.1 | Orgs: List | ⬜ | - |
| 10.4.2 | Orgs: Create | ⬜ | - |
| 10.4.3 | Orgs: Detail | ⬜ | - |
| 10.4.4 | Orgs: Update | ⬜ | - |
| 10.5.1 | Claims: List | ⬜ | - |
| 10.5.2 | Claims: Detail | ⬜ | - |
| 10.5.3 | Claims: Approve | ⬜ | - |
| 10.5.4 | Claims: Reject | ⬜ | - |
| 10.6.1 | Profiles: List | ⬜ | - |
| 10.6.2 | Profiles: Detail | ⬜ | - |
| 10.6.3 | Profiles: Delete | ⬜ | - |
| 10.7.1 | Grants: List | ⬜ | - |
| 10.7.2 | Grants: Detail | ⬜ | - |
| 10.8.1 | Bounties: List | ⬜ | - |
| 10.8.2 | Bounties: Detail | ⬜ | - |
| 10.9.1 | Imports: List | ⬜ | - |
| 10.9.2 | Imports: Detail | ⬜ | - |

---

## Notes

- All endpoints require superadmin session cookie
- Use Chrome DevTools to capture cookies from admin app at http://localhost:3005
- Save all evidence files to `.pr151-test-assets/screenshots/phase-10/`
- Update this checklist after each test with findings
- Document any 🔴 critical issues found during testing
