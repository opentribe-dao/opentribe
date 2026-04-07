# Phase 8 Test Prompt: Public Web — Organizations & Grants

**Objective**: Validate organizations directory, organization details, grants page, grant details, and grant applications flow on the public web.

**Branch**: `feat/admin-app`  
**Ports**: Web (3000), API (3002), Dashboard (3001), Admin (3003)

---

## Test Coverage Overview

| Section | Tests | Coverage | Known Issues |
|---------|-------|----------|--------------|
| 8.1 - Organizations Directory | 6 tests | 0% | Known bug: "Try again" button; undefined error |
| 8.2 - Organization Detail | 5 tests | 0% | Known bug: may return 404 |
| 8.3 - Grants Page | 4 tests | 0% | New, needs full testing |
| 8.4 - Grant Detail | 3 tests | 0% | New, needs full testing |
| 8.5 - Grant Applications | 4 tests | 0% | New, needs full testing |
| **Total** | **22 tests** | **0%** | **Target: 70%+ coverage** |

---

## 8.1: Organizations Directory

**URL**: `http://localhost:3000/organizations`  
**API Endpoint**: `GET /api/v1/organizations?search={query}&type={type}&pageSize={size}&pageNumber={page}`

### Test 8.1.1: Page Load & Initial State

**Steps**:
1. Navigate to `http://localhost:3000/organizations`
2. Wait for page to fully load (no errors)
3. Check console for errors
4. Verify organization cards appear

**Expected**:
- Page loads without "Try again" button
- No "Cannot read properties of undefined" errors
- Organizations list displays
- Search box visible
- Type filter dropdown visible
- Pagination visible (if orgs > 20)

**Known Issue**: Phase 4 reported "Try again" button appearing; investigate cause.

---

### Test 8.1.2: API Response Structure

**Steps**:
1. Open Chrome DevTools → Network tab
2. Refresh page
3. Find `GET /api/v1/organizations` request
4. Examine response body

**Expected**:
- HTTP 200 response
- Response contains array of organization objects
- Each org has: `id`, `name`, `slug`, `type`, `logo` (or null), `_count` object
- `_count` contains: `grants`, `bounties`, `members`
- Response includes pagination metadata: `pageSize`, `pageNumber`, `totalCount`

**Acceptance Criteria**:
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "slug": "string",
      "type": "enum (DAO|FOUNDATION|PROJECT|OTHER)",
      "logo": "string|null",
      "description": "string|null",
      "_count": {
        "grants": number,
        "bounties": number,
        "members": number
      }
    }
  ],
  "pageSize": number,
  "pageNumber": number,
  "totalCount": number
}
```

---

### Test 8.1.3: Search Functionality

**Steps**:
1. In the search box, type organization name (e.g., "Polkadot")
2. Wait for results to filter (should be instant or <1s)
3. Verify displayed orgs match search term
4. Clear search, verify all orgs return

**Expected**:
- Search filters by organization name and slug
- Results update instantly without page reload
- Case-insensitive matching
- Partial matches work (e.g., "pol" matches "Polkadot")
- Clearing search shows all orgs again

---

### Test 8.1.4: Type Filter

**Steps**:
1. Click the "Type" dropdown
2. Select "DAO"
3. Verify only DAO organizations show
4. Select "FOUNDATION"
5. Verify only Foundation orgs show
6. Select "All Types" (if available)
7. Verify all orgs return

**Expected**:
- Dropdown shows types: DAO, FOUNDATION, PROJECT, OTHER (or whatever enums exist)
- Filtering works correctly for each type
- Selection persists in URL or state
- "All Types" shows unfiltered results

---

### Test 8.1.5: Organization Cards Display

**Steps**:
1. Observe organization card layout
2. Check each card contains:
   - Organization logo (if exists)
   - Organization name
   - Organization type badge
   - Member count
   - Grant count
   - Bounty count

**Expected**:
- Logo displays if present; placeholder if null
- Type badge shows correct type with appropriate styling
- Counts are accurate (match API `_count` response)
- Cards are clickable (navigate to org detail page)

---

### Test 8.1.6: Pagination

**Steps**:
1. If organizations count > 20:
   - Verify pagination controls appear
   - Click "Next" page
   - Verify new orgs load
   - Click "Previous"
   - Verify original orgs return
2. If count ≤ 20:
   - Verify pagination not shown

**Expected**:
- Pagination controls functional
- Page change loads new results
- Correct organizations per page (default 20)
- Current page indicator accurate

---

## 8.2: Organization Detail Page

**URL**: `http://localhost:3000/organizations/{slug}`  
**Example**: `http://localhost:3000/organizations/polkadot-foundation`

### Test 8.2.1: Page Load for Valid Organization

**Steps**:
1. From organizations directory, click an organization card
2. Wait for detail page to load
3. Check URL matches org slug
4. Verify no 404 errors

**Expected**:
- Page loads successfully
- URL is `/organizations/{slug}`
- Organization data displays (name, logo, description)
- No console errors

**Known Issue**: Phase 4 reported possible 404; investigate if specific orgs missing.

---

### Test 8.2.2: Organization Header

**Steps**:
1. Check page header displays:
   - Organization logo
   - Organization name
   - Organization type badge (DAO/FOUNDATION/PROJECT/OTHER)
   - Verification badge (if verified)
   - Description text

**Expected**:
- Logo displays prominently
- Type badge styled appropriately
- Verification badge visible if org is verified
- Description text readable (max 2-3 lines or expandable)

---

### Test 8.2.3: New Organization Fields

**Steps**:
1. Check page displays:
   - `orgType` (same as type badge, but verify it exists in data)
   - `managedByPlatform` (boolean indicator: "Managed by Opentribe" if true)
   - `ecosystemSource` (if present: "Source: Polkadot", "Source: Custom", etc.)

**Expected**:
- All three fields present in page layout or API response
- `managedByPlatform` affects presentation (e.g., badge styling)
- `ecosystemSource` displayed if available

---

### Test 8.2.4: Grants Section

**Steps**:
1. Scroll to "Grants" section
2. Verify grant cards show organization's grants
3. Each grant card displays:
   - Grant title
   - Status (Active/Completed/Pending)
   - Funding amount
   - Application count
4. Click a grant card → navigate to grant detail page

**Expected**:
- Grants section lists all org's grants
- Only grants belonging to this org show
- Grant data accurate (matches grant detail page)
- Links functional

---

### Test 8.2.5: Members Section

**Steps**:
1. Scroll to "Members" section
2. Verify member list shows
3. Each member shows:
   - Member avatar
   - Member name
   - Member role (if available: Owner, Admin, Member, etc.)
4. Click member → navigate to member profile (if implemented)

**Expected**:
- Members section lists organization members
- Member count matches header (if displayed there)
- Member data accurate
- Layout responsive (cards or list)

---

## 8.3: Grants Page

**URL**: `http://localhost:3000/grants`  
**API Endpoint**: `GET /api/v1/grants?search={query}&status={status}&pageSize={size}`

### Test 8.3.1: Page Load

**Steps**:
1. Navigate to `http://localhost:3000/grants`
2. Wait for page to load
3. Check console for errors

**Expected**:
- Page loads without errors
- Grant cards display
- Search box visible
- Status filter dropdown visible
- Grant cards show organization logos

---

### Test 8.3.2: Search Functionality

**Steps**:
1. In search box, type grant title (e.g., "Web3")
2. Wait for results to filter
3. Verify displayed grants match search term
4. Clear search, verify all grants return

**Expected**:
- Search filters by grant title
- Results update instantly
- Case-insensitive
- Partial matches work

---

### Test 8.3.3: Status Filter

**Steps**:
1. Click status dropdown
2. Select "Active"
3. Verify only active grants show
4. Select "Completed"
5. Verify only completed grants show
6. Select "All Statuses" (if available)
7. Verify all grants return

**Expected**:
- Dropdown shows status options: Active, Completed, Pending, Cancelled (or actual enums)
- Filtering works for each status
- "All Statuses" shows unfiltered results

---

### Test 8.3.4: Grant Cards Display

**Steps**:
1. Observe grant card layout
2. Check each card contains:
   - Grant title
   - Organization logo and name
   - Status badge
   - Funding amount
   - Application count (if available)
   - Description snippet (if available)
3. Click card → navigate to grant detail

**Expected**:
- Cards display all required information
- Status badge styled appropriately
- Amount formatted correctly (currency)
- Cards clickable
- No truncation issues (text readable)

---

## 8.4: Grant Detail Page

**URL**: `http://localhost:3000/grants/{id}`

### Test 8.4.1: Page Load

**Steps**:
1. From grants page, click a grant card
2. Wait for detail page to load
3. Check URL is `/grants/{id}`

**Expected**:
- Page loads successfully
- Grant data displays
- Organization information shown
- No console errors

---

### Test 8.4.2: Grant Information Display

**Steps**:
1. Verify page displays:
   - Grant title
   - Organization logo + name (clickable to org detail)
   - Status badge
   - Funding amount
   - Description/requirements
   - Deadline (if available)
   - Application deadline (if available)
   - Linked RFPs count

**Expected**:
- All information present and accurate
- Organization link functional
- Status badge matches status
- Amounts formatted correctly

---

### Test 8.4.3: Application/External Link CTA

**Steps**:
1. Check Call-to-Action button:
   - If grant source is INTERNAL: "Apply for Grant" button visible
   - If grant source is EXTERNAL: "View on External Site" button visible
2. If internal: Click "Apply for Grant"
   - Should navigate to application form
3. If external: Click link
   - Should open external URL in new tab
   - Verify URL is correct

**Expected**:
- Correct CTA button shown based on source
- Internal button navigates to application form
- External button opens URL
- No broken links

---

## 8.5: Grant Applications Page

**URL**: `http://localhost:3000/grants/{id}/applications`

### Test 8.5.1: Page Load

**Steps**:
1. From grant detail page, click "View Applications" or similar
2. Wait for applications list to load

**Expected**:
- Page loads successfully
- Applications list displays
- Applicant information shown
- Status indicators visible

---

### Test 8.5.2: Applicant Resolution

**Steps**:
1. Observe each application listing
2. Verify applicant information shows:
   - Applicant name or "Anonymous"
   - Applicant avatar (if available)
   - User profile link (if user exists)
   - Or ecosystem profile link (if ecosystem profile exists)

**Expected**:
- If applicant has user profile: show user name + link
- If applicant is ecosystem profile: show ecosystem profile name + link
- If no applicant data: show "Anonymous"
- No crashes or undefined errors

---

### Test 8.5.3: Fallback Handling

**Steps**:
1. Check applications where applicant data may be missing
2. Verify no crashes occur
3. Verify sensible fallback (e.g., "Anonymous User")

**Expected**:
- Graceful handling of missing applicant data
- No console errors
- Page remains functional

---

### Test 8.5.4: Milestones (If Available)

**Steps**:
1. If grant has milestones:
   - Verify milestone progress shown
   - Check completion status
   - Verify dates accurate
2. If grant has no milestones:
   - Verify no milestone section shown or shows "No milestones"

**Expected**:
- Milestones display correctly if present
- Progress bar accurate
- Dates match expected format
- No crashes if milestones absent

---

## Acceptance Criteria (Phase 8)

**Minimum Coverage for Phase 8 Completion: 70% (15/22 tests)**

**Scoring**:
- ✅ **PASS**: Feature works as expected, no bugs
- ⚠️ **PARTIAL**: Feature mostly works, minor issues documented
- ❌ **FAIL**: Feature broken or missing
- ⬜ **NOT TESTED**: Skipped or deferred

**Pass Condition**:
- ≥15/22 tests passing (70%)
- Known issues documented with workarounds
- No blocker bugs preventing navigation
- Console errors acceptable if not blocking functionality

**Failure Condition**:
- <15/22 tests passing
- Page crashes or unrecoverable 404s
- Missing critical UI elements

---

## Known Issues Tracker

| Issue | Test | Impact | Status |
|-------|------|--------|--------|
| "Try again" button on organizations page | 8.1.1 | Blocks page load | To investigate |
| Possible 404 on org detail | 8.2.1 | Navigation broken for some orgs | To investigate |
| "Cannot read properties of undefined" | 8.1.1 | Console error | To investigate |

---

## Testing Tools & Commands

**Start Services** (if needed):
```bash
pnpm dev  # Starts all dev servers
```

**Chrome DevTools** (for network inspection):
- Press F12 or Cmd+Opt+I
- Go to Network tab
- Filter by Fetch/XHR to see API calls
- Check Response tab for API data structure

**Database Query** (for verification):
```bash
psql postgresql://tarun@localhost:5432/opentribe -c "SELECT slug, name, type FROM organization LIMIT 10;"
```

**Test Data**:
- Organizations already seeded; check database for actual slugs to test
- Grants linked to organizations
- Applications linked to grants

---

## Phase 8 Testing Order

1. **8.1** - Organizations Directory (prerequisite for 8.2)
2. **8.2** - Organization Detail (depends on 8.1)
3. **8.3** - Grants Page (can run independently)
4. **8.4** - Grant Detail (depends on 8.3)
5. **8.5** - Grant Applications (depends on 8.4)

**Recommended order**: 8.1 → 8.2 → 8.3 → 8.4 → 8.5 (sequential to test navigation flow)

---

## Success Criteria Summary

**Phase 8 is COMPLETE when**:
- [ ] ≥15/22 tests passing (70%)
- [ ] Known bugs documented with mitigations
- [ ] No new bugs introduced
- [ ] Navigation between pages functional
- [ ] API responses match expected schema
- [ ] UI displays data without crashes
- [ ] Console errors (if any) non-blocking
