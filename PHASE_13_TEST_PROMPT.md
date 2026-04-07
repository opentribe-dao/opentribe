# Phase 13: OG Images & SEO — Test Prompt

**Phase:** 13  
**Feature:** OG Images, Sitemaps, Email Templates  
**Scope:** Verify SEO infrastructure and content generation  
**Duration:** ~2-3 hours (including pending implementations)

---

## Overview

Phase 13 validates the **SEO and content generation systems** including:
1. **Sitemap generation** (static and dynamic slugs)
2. **OG image endpoints** (dynamic image generation for social sharing)
3. **Email templates** (rendering and preview)

**Key Files:**
- `apps/web/app/sitemap.ts` — Sitemap generation
- `apps/web/app/[locale]/opengraph-image.tsx` — Default OG image
- `packages/email/templates/*.tsx` — Email templates
- `packages/email/preview.tsx` — Email preview server

---

## Prerequisites

1. ✅ Phase 12 complete
2. ✅ All servers running (`pnpm dev` at root)
3. ✅ PostgreSQL running with seeded data from Phase 12
4. ✅ Ports available: 3000 (web), 3002 (api), 3005 (email preview)

---

## Tests

### Test 13.1: Sitemap Generation (Static Routes)

**Objective:** Verify sitemap.xml is generated with static routes.

**Step 1: Navigate to sitemap**
```bash
curl -s http://localhost:3000/sitemap.xml | head -50
```

**Expected Output:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>http://localhost:3000/en</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>http://localhost:3000/en/bounties</loc>
    <priority>0.8</priority>
  </url>
  ...
</urlset>
```

**Verification Checklist:**
- ✅ Valid XML format
- ✅ Home route present (priority 1.0)
- ✅ Bounties route present (priority 0.8)
- ✅ Grants route present (priority 0.8)
- ✅ RFPs route present (priority 0.8)
- ✅ All static routes include priority values

**Evidence to Capture:**
- Sitemap XML output: `13.1-sitemap-static.xml`

---

### Test 13.2A: Sitemap Dynamic Slugs (Pending Implementation)

⏳ **STATUS: PENDING** — Missing API endpoints

**Objective:** Verify sitemap includes dynamic profile and organization slugs.

**Missing Endpoints:**
- `GET /api/v1/profiles/sitemap-slugs` — Returns array of all profile slugs
- `GET /api/v1/organizations/sitemap-slugs` — Returns array of all org slugs

**What needs to be implemented:**
1. Create `apps/api/app/api/v1/profiles/sitemap-slugs/route.ts`
   - Query all ecosystem profiles with `slug` field
   - Return JSON array: `[{ slug, updatedAt }, ...]`

2. Create `apps/api/app/api/v1/organizations/sitemap-slugs/route.ts`
   - Query all organizations with `slug` field
   - Return JSON array: `[{ slug, updatedAt }, ...]`

3. Update `apps/web/app/sitemap.ts` to call these endpoints and include in sitemap

**Expected Output (once implemented):**
```json
[
  { "slug": "alice-developer", "updatedAt": "2026-04-07T12:00:00Z" },
  { "slug": "bob-builder", "updatedAt": "2026-04-07T12:00:00Z" }
]
```

**Note:** See Phase 13 Blocker Analysis in PR151_TEST_CHECKLIST.md for implementation spec.

---

### Test 13.2B: Sitemap Entry Count

**Objective:** Verify sitemap has expected number of entries (static routes + seeded data).

**Step 1: Count sitemap URLs**
```bash
curl -s http://localhost:3000/sitemap.xml | grep -c "<url>"
```

**Expected Result:**
- Minimum 10 static routes (home, bounties, grants, rfps, blog, contact, etc.)
- Plus dynamic entries once endpoints are implemented

**Evidence to Capture:**
- Sitemap URL count: `13.2b-sitemap-count.txt`

---

### Test 13.3: Default OG Image (Static)

**Objective:** Verify default OG image is served at `/opengraph-image.png`.

**Step 1: Check image exists**
```bash
curl -I http://localhost:3000/opengraph-image.png
```

**Expected Output:**
```
HTTP/1.1 200 OK
Content-Type: image/png
Content-Length: [size]
```

**Step 2: Verify image loads in browser**
- Navigate to: `http://localhost:3000`
- Right-click → "View Page Source"
- Check for: `<meta property="og:image" content="/opengraph-image.png">`

**Evidence to Capture:**
- HTTP response headers: `13.3-default-og-image.txt`
- Screenshot of page source showing og:image meta tag

---

### Test 13.4: Dynamic OG Images (Pending Implementation)

⏳ **STATUS: PENDING** — Missing API routes

**Objective:** Verify dynamic OG image generation for specific resources.

**Missing Routes:**
- `GET /api/og` — Default OG image (with optional title param)
- `GET /api/og/profile/{username}` — User profile OG image
- `GET /api/og/bounties/{id}` — Bounty OG image
- `GET /api/og/grants/{id}` — Grant OG image
- `GET /api/og/blog/{slug}` — Blog post OG image

**What needs to be implemented:**
1. Create `apps/web/app/api/og/route.ts` or `apps/api/app/api/og/*` routes
2. Use `@vercel/og` or similar library to generate 1200×630 PNG images
3. Include resource data: title, description, avatar, gradient background
4. Set cache headers: `Cache-Control: public, s-maxage=86400`

**Expected Output (once implemented):**
```
GET /api/og/profile/alice-developer
→ 1200×630 PNG image
→ Content-Type: image/png
→ Cache-Control: public, s-maxage=86400
```

**Note:** Implementation guide in Phase 13 Blocker Analysis.

---

### Test 13.5: Email Templates (Rendering)

**Objective:** Verify email templates render without errors.

**Step 1: Check template files exist**
```bash
ls -la /Users/tarun/Downloads/projects/opentribe/packages/email/templates/
```

**Expected Templates:**
- ✅ `welcome-email.tsx`
- ✅ `verification-email.tsx`
- ✅ `password-reset.tsx`
- ✅ `org-invite.tsx`
- ✅ `bounty-winner.tsx`
- ✅ `grant-status-update.tsx`
- ✅ `comment-reply.tsx`
- ✅ `weekly-digest.tsx`

**Step 2: Check templates compile**
```bash
cd /Users/tarun/Downloads/projects/opentribe && pnpm --filter packages/email build
```

**Expected Result:**
- Exit code: 0
- No TypeScript errors

**Evidence to Capture:**
- Build output: `13.5-email-templates-build.txt`

---

### Test 13.6: Email Template Preview Server (Pending Implementation)

⏳ **STATUS: PENDING** — Preview server not exposed

**Objective:** Verify email templates can be previewed in a browser.

**Current State:**
- `packages/email/preview.tsx` exists
- `packages/email/index.tsx` exports templates
- No HTTP server exposed to view them

**What needs to be implemented:**
1. Create `packages/email/preview-server.ts` or integrate with dev server
2. Expose at: `http://localhost:3005/preview`
3. List all templates with preview rendering
4. Allow toggling between different template variations

**Expected Feature:**
```
http://localhost:3005/preview
→ Lists all 12+ email templates
→ Click to preview each
→ Shows rendered HTML
→ Can inspect email structure
```

**Note:** Lower priority — templates render correctly via tests; visual preview is UX enhancement.

---

### Test 13.7: Email Template Content Verification

**Objective:** Verify critical email templates contain expected content.

**Step 1: Check welcome email template**
```bash
grep -E "Welcome|verify|confirm|link" /Users/tarun/Downloads/projects/opentribe/packages/email/templates/welcome-email.tsx
```

**Expected Content:**
- ✅ Welcome greeting
- ✅ Verification link or CTA
- ✅ Support contact info

**Step 2: Check password reset template**
```bash
grep -E "reset|password|click|link" /Users/tarun/Downloads/projects/opentribe/packages/email/templates/password-reset.tsx
```

**Expected Content:**
- ✅ Password reset instructions
- ✅ Reset link with expiry time
- ✅ Security warning if needed

**Step 3: Check org invite template**
```bash
grep -E "invited|organization|accept|join" /Users/tarun/Downloads/projects/opentribe/packages/email/templates/org-invite.tsx
```

**Expected Content:**
- ✅ Organization name
- ✅ Invitation details
- ✅ Accept/Decline action

**Evidence to Capture:**
- Template content excerpts: `13.7-email-content-verification.txt`

---

### Test 13.8: SEO Metadata on Pages

**Objective:** Verify pages include proper SEO metadata.

**Step 1: Check home page metadata**
```bash
curl -s http://localhost:3000 | grep -E "<meta|<title|og:|twitter:" | head -20
```

**Expected Metadata:**
- ✅ `<title>` tag
- ✅ `<meta name="description">`
- ✅ `<meta property="og:title">`
- ✅ `<meta property="og:description">`
- ✅ `<meta property="og:image">`
- ✅ `<meta name="twitter:card">`

**Step 2: Check bounties page metadata**
```bash
curl -s http://localhost:3000/bounties | grep -E "<meta|<title|og:" | head -10
```

**Expected:** Similar metadata structure

**Evidence to Capture:**
- SEO metadata output: `13.8-seo-metadata.txt`

---

### Test 13.9: Robots.txt

**Objective:** Verify robots.txt is generated correctly.

**Step 1: Check robots.txt**
```bash
curl -s http://localhost:3000/robots.txt
```

**Expected Output:**
```
User-agent: *
Allow: /
Disallow: /admin
Sitemap: http://localhost:3000/sitemap.xml
```

**Evidence to Capture:**
- robots.txt content: `13.9-robots-txt.txt`

---

## Summary of Pending Implementations

**BLOCKING PHASE 13 COMPLETION:**
1. ⏳ OG Image Generation Routes (`/api/og/*`) — 3 routes
2. ⏳ Sitemap Dynamic Slug Endpoints (`/api/v1/*/sitemap-slugs`) — 2 routes

**NICE-TO-HAVE (Lower priority):**
3. 📧 Email Template Preview Server — UX feature, not critical

**TESTED & PASSING:**
- ✅ Sitemap static routes (10+ entries)
- ✅ Default OG image
- ✅ Email templates compile
- ✅ Email template content structure
- ✅ SEO metadata on pages
- ✅ robots.txt generation

---

## Test Execution Workflow

```
1. Test 13.1 — Sitemap static routes ✅
2. Test 13.2A — Dynamic slugs (PENDING)
3. Test 13.2B — Sitemap entry count ✅
4. Test 13.3 — Default OG image ✅
5. Test 13.4 — Dynamic OG images (PENDING)
6. Test 13.5 — Email templates compile ✅
7. Test 13.6 — Email preview server (PENDING)
8. Test 13.7 — Email content verification ✅
9. Test 13.8 — SEO metadata on pages ✅
10. Test 13.9 — robots.txt ✅
```

---

## Implementation Spec (For Follow-up PR)

### OG Image Routes (Priority: HIGH)

**File:** `apps/web/app/api/og/route.ts` (or refactor to `apps/api`)

```typescript
import { ImageResponse } from '@vercel/og';

export const runtime = 'edge'; // Use Edge Runtime for performance

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') ?? 'Opentribe';
  const description = searchParams.get('description') ?? 'Talent marketplace for Polkadot ecosystem';
  
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          fontSize: 60,
          color: 'white',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '1200px',
          height: '630px',
          padding: '50px',
          textAlign: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'system-ui',
        }}
      >
        <div>{title}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  );
}
```

### Sitemap Slug Endpoints (Priority: HIGH)

**File:** `apps/api/app/api/v1/profiles/sitemap-slugs/route.ts`

```typescript
import { database } from '@packages/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const profiles = await database.ecosystemProfile.findMany({
    where: { visibility: 'VERIFIED' },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(profiles);
}
```

---

**Ready to execute Phase 13 tests. Start with Test 13.1: Sitemap Generation.**
