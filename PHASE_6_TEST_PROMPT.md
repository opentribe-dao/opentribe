# Phase 6: Public Web — Profile Routes — Test Prompt

**Phase:** 6 — Public Web Profile Routes  
**URL:** `http://localhost:3000`  
**Objective:** Test profile API union type responses and public-facing profile pages

**Status:** ⏳ Ready to Begin  
**Test Environment:** 
- Public web app: `http://localhost:3000` (running)
- API backend: `http://localhost:3002` (running)
- Chrome DevTools: Available for automated testing

---

## Phase 6 Overview

Phase 6 focuses on testing the **public web profile routes** that enable:
1. Public viewing of user profiles
2. Public viewing of ecosystem profiles
3. Redirects for claimed profiles
4. SEO metadata (OG tags)

### Key APIs Being Tested

**Profile API** (`GET /api/v1/profiles/{slug}/public`):
- Returns **union type** with 3 possible shapes
- Type `"user"`: User profile with claimed ecosystem profiles
- Type `"ecosystem"`: Unclaimed ecosystem profile
- Type `"redirect"`: Claimed ecosystem profile (redirects to user)

### Prerequisite Data

✅ **From Phase 5 (Claims Testing)**:
- Han Zhao ecosystem profile → claimed by Alice Chen (VERIFIED)
- Shihao Zhao ecosystem profile → claimed by Carol Thompson (VERIFIED)
- Yvonne Xie ecosystem profile → claimed by Bob Martinez (REJECTED)
- 1,426 ecosystem profiles available from seed

✅ **Test Users Available**:
- alice_substrate (Alice Chen) — has 1 claimed ecosystem profile
- bob_ui (Bob Martinez) — has 1 rejected claim (still owns profile)
- carol_writer (Carol Thompson) — has 1 claimed ecosystem profile
- david_w3f (David Kim) — no claims
- emma_moonbeam (Emma Wilson) — no claims

---

## Test 6.1: Profile API — Union Type Response

### Objective
Verify the profile API returns correct response shapes for user, ecosystem, and redirect types.

### Test Cases

#### 6.1a: API returns `type: "user"` for user slug
- **Request:** `GET /api/v1/profiles/alice_substrate/public`
- **Expected Response Shape:**
  ```json
  {
    "type": "user",
    "data": {
      "id": "...",
      "username": "alice_substrate",
      "displayName": "Alice Chen",
      "email": "...",
      "avatar": "...",
      "headline": "...",
      "bio": "...",
      "skills": [...],
      "verified": true,
      "private": false
    },
    "claimedEcosystemProfiles": [
      {
        "id": "...",
        "displayName": "Han Zhao",
        "source": "W3F_GRANTS",
        "slug": "han_zhao_profile_slug"
      }
    ]
  }
  ```
- **Check:** `response.type === "user"`
- **Check:** `response.claimedEcosystemProfiles.length > 0`

#### 6.1b: API returns `type: "ecosystem"` for unclaimed ecosystem slug
- **Request:** `GET /api/v1/profiles/{unclaimed_ecosystem_slug}/public`
- **Expected Response Shape:**
  ```json
  {
    "type": "ecosystem",
    "data": {
      "id": "...",
      "displayName": "...",
      "slug": "...",
      "bio": "...",
      "source": "W3F_GRANTS",
      "skills": [...]
    }
  }
  ```
- **Check:** `response.type === "ecosystem"`
- **Check:** `response.claimedEcosystemProfiles === undefined` (not present)

#### 6.1c: API returns `type: "redirect"` for claimed ecosystem slug
- **Request:** `GET /api/v1/profiles/han_zhao_profile_slug/public`
- **Expected Response Shape:**
  ```json
  {
    "type": "redirect",
    "redirectTo": "/profile/alice_substrate"
  }
  ```
- **Check:** `response.type === "redirect"`
- **Check:** `response.redirectTo === "/profile/alice_substrate"`

---

## Test 6.2: User Profile Page

### Objective
Verify user profile pages render correctly with all required UI sections.

### Test Cases

#### 6.2a: User profile page loads and displays user info
- **Navigate:** `http://localhost:3000/[locale]/profile/alice_substrate`
- **Expected:**
  - Page title includes user's display name
  - Avatar visible
  - Display name displayed
  - Headline visible (if set)
  - Bio visible (if set)
  - Skills section visible with chip cards
  - All text renders correctly (no "undefined", no console errors)

#### 6.2b: User profile shows claimed ecosystem profiles
- **Navigate:** `http://localhost:3000/[locale]/profile/alice_substrate`
- **Expected:**
  - Section titled "Claimed Profiles" or similar
  - Shows Han Zhao ecosystem profile card
  - Profile card displays: display name, source badge (W3F_GRANTS), link to profile

#### 6.2c: Social links render if present
- **Navigate:** `http://localhost:3000/[locale]/profile/alice_substrate`
- **Expected:**
  - GitHub link if user has GitHub (clickable)
  - Twitter link if user has Twitter (clickable)
  - LinkedIn link if user has LinkedIn (clickable)
  - Other social links if present
  - Links open in new tab or navigate correctly

#### 6.2d: Tabs navigation functional
- **Navigate:** `http://localhost:3000/[locale]/profile/alice_substrate`
- **Expected tabs:**
  - Applications (if applicable)
  - Submissions (if applicable)
  - Contributions (if applicable)
  - Activity (if applicable)
- **Test:** Click each tab, verify content changes and no errors

#### 6.2e: Private profile handling
- **Setup:** Find or create a user with `private: true` profile setting
- **Navigate:** `http://localhost:3000/[locale]/profile/{private_user}`
- **Expected:**
  - Limited info visible (name, headline only)
  - Bio/email/contact info not visible
  - Message: "This profile is private"
  - OR redirect to login if profile completely private

#### 6.2f: OG meta tags present
- **Navigate:** `http://localhost:3000/[locale]/profile/alice_substrate`
- **View Page Source** (Ctrl+U / Cmd+U)
- **Expected:**
  - `<meta property="og:title" content="Alice Chen | Opentribe">`
  - `<meta property="og:image" content="...">`
  - `<meta property="og:description" content="...">`
  - `<meta property="og:url" content="...">`

---

## Test 6.3: Ecosystem Profile Page

### Objective
Verify ecosystem profile pages render correctly with all required UI sections.

### Prerequisite
- Ecosystem profiles exist in database (1,426 from seed)
- At least one claimed and one unclaimed for testing

### Test Cases

#### 6.3a: Ecosystem profile page loads and displays profile info
- **Navigate:** `http://localhost:3000/[locale]/profile/{ecosystem_slug}`
- **Expected:**
  - Page title includes profile's display name
  - Display name displayed
  - Bio visible (if set)
  - Skills section visible
  - Source badge visible (W3F_GRANTS, Kusama, Polkadot, etc.)
  - No "undefined" text, no console errors

#### 6.3b: Ecosystem profile shows contributions
- **Navigate:** `http://localhost:3000/[locale]/profile/{ecosystem_slug}`
- **Expected:**
  - Contributions section visible
  - Grant links visible (if any grants associated)
  - Milestone progress bars visible (if any)
  - Contribution source clearly labeled

#### 6.3c: Unclaimed ecosystem profile shows "Claim" CTA
- **Navigate:** `http://localhost:3000/[locale]/profile/{unclaimed_ecosystem_slug}`
- **Expected (Logged Out):**
  - "Sign in to claim this profile" or similar CTA visible
  - Clicking opens auth modal

- **Expected (Logged In, not claimer):**
  - "Claim this profile" button visible
  - Button clickable, navigates to `/profile/claim/{slug}`

#### 6.3d: Claimed ecosystem profile shows ownership indicator
- **Navigate:** `http://localhost:3000/[locale]/profile/han_zhao_profile_slug`
- **Expected:**
  - Redirect to `/profile/alice_substrate` (claimed by Alice)
  - OR shows "This profile is claimed by alice_substrate" with link

#### 6.3e: No console errors on ecosystem profile
- **Open DevTools (F12 → Console)**
- **Navigate:** `http://localhost:3000/[locale]/profile/{ecosystem_slug}`
- **Expected:**
  - No red error messages
  - Specifically: No `toUpperCase()` errors (KNOWN BUG — see 6.3f)

#### 6.3f: KNOWN BUG — `toUpperCase()` on undefined status
- **Status:** ⚠️ May fail on some ecosystem profiles
- **Cause:** Component tries to format claim status without null check
- **Error:** `Cannot read properties of undefined (reading 'toUpperCase')`
- **Workaround:** Use profiles with known claims (Han Zhao, Shihao Zhao, etc.)
- **Issue:** To be fixed in follow-up commit

#### 6.3g: Pending claim state display
- **Navigate:** `http://localhost:3000/[locale]/profile/{yvonne_xie_slug}`
- **Logged in as Bob Martinez (who made the rejected claim)**
- **Expected:**
  - Profile page loads
  - Shows claim status indicator: "Claim pending review" or similar
  - Shows date of claim submission

---

## Test 6.4: Claimed Profile Redirect

### Objective
Verify that accessing a claimed ecosystem profile's slug redirects to the claimer's user profile.

### Test Cases

#### 6.4a: Claimed ecosystem slug redirects to user profile
- **Navigate:** `http://localhost:3000/[locale]/profile/{han_zhao_ecosystem_slug}`
- **Expected:**
  - Browser redirects to `http://localhost:3000/[locale]/profile/alice_substrate`
  - URL bar updates
  - No blank/error page

#### 6.4b: Redirect is HTTP 302/307 (not permanent 301)
- **Open DevTools (F12 → Network)**
- **Navigate:** `http://localhost:3000/[locale]/profile/{han_zhao_ecosystem_slug}`
- **Check Network Tab:**
  - First request shows 302 or 307 status (temporary redirect)
  - Second request loads alice_substrate profile (200)
  - No 404 errors

---

## Test Execution Workflow

### Before Starting
1. ✅ Verify admin app is running (`http://localhost:3003` accessible)
2. ✅ Verify web app is running (`http://localhost:3000` accessible)
3. ✅ Verify API is running (`http://localhost:3002` accessible)
4. ✅ Verify database seed completed (5 test claims from Phase 5)

### Testing Procedure
1. **Use Chrome DevTools** for automated testing (preferred)
   - Navigate to URLs
   - Inspect page elements
   - Check network requests
   - Verify OG meta tags
   - Monitor console for errors

2. **Manual inspection** where needed
   - View page source for meta tags
   - Check redirect behavior in network tab
   - Test responsive design (optional)

3. **Document findings**
   - Screenshot each passing test
   - Note any console errors
   - Record redirect status codes
   - Save network request/response examples

### Success Criteria

#### Phase 6 is COMPLETE when:
- ✅ Test 6.1: All 3 API response types verified (user, ecosystem, redirect)
- ✅ Test 6.2: User profile page displays all sections with correct data
- ✅ Test 6.3: Ecosystem profile page displays all sections (accounting for KNOWN BUG)
- ✅ Test 6.4: Claimed profile redirects work correctly (302/307 status)
- ✅ All tests have supporting screenshots
- ✅ PR151_TEST_CHECKLIST.md updated with results

---

## Known Issues & Deferrals

### 🔴 KNOWN BUG — Ecosystem Profile Status Formatting
- **Issue:** Component tries to format claim status with `.toUpperCase()` without null check
- **Trigger:** Accessing ecosystem profile with undefined claim status
- **Workaround:** Test with profiles that have known claims (Han Zhao, Shihao Zhao)
- **Fix:** Requires code change in ecosystem profile component (not Phase 6 scope)

### ⚠️ Deferred to Phase 6b or Later
- Responsive design testing (tablet/mobile viewports)
- Accessibility audit (keyboard navigation, screen reader)
- Performance metrics (load time, Core Web Vitals)
- Internationalization testing (non-English locales)

---

## Links & References

**Test Data Users:**
- Alice Chen: `alice_substrate` (has 1 claimed ecosystem profile)
- Bob Martinez: `bob_ui` (made a rejected claim)
- Carol Thompson: `carol_writer` (has 1 claimed ecosystem profile)

**Test Ecosystem Profiles:**
- Han Zhao (claimed by Alice Chen): Use actual slug from DB
- Shihao Zhao (claimed by Carol Thompson): Use actual slug from DB
- Yvonne Xie (claim rejected by Bob Martinez): Use actual slug from DB
- Any unclaimed ecosystem profile: Pick from 1,426 available

**Related Files:**
- `apps/web/app/[locale]/profile/[username]/page.tsx` — User profile page
- `apps/web/app/[locale]/profile/[slug]/page.tsx` — Ecosystem profile page
- `apps/api/app/api/v1/profiles/[slug]/public/route.ts` — Profile API

---

## Ready to Begin?

✅ Database seeded with test claims (Phase 5)  
✅ All apps running  
✅ Chrome DevTools available  

**Next Step:** Start testing Phase 6.1 (Profile API Union Types)
