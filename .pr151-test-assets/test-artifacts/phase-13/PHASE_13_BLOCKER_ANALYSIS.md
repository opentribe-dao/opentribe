# Phase 13: OG Images & SEO — Blocker Analysis

## Executive Summary

**Phase 13 Partial Completion: 6/9 Tests PASSED ✅ | 3/9 Tests PENDING (Missing Implementations)**

### Tests Passing (6/9)
- ✅ Test 13.1: Sitemap generation (static routes) — 15 entries
- ✅ Test 13.2B: Sitemap entry count — Verified
- ✅ Test 13.3: Default OG image — HTTP 200
- ✅ Test 13.5: Email templates compilation — TypeCheck passed
- ✅ Test 13.8: SEO metadata on pages — All tags present
- ✅ Test 13.9: robots.txt generation — Correct format

### Tests Pending (3/9)
- ⏳ Test 13.2A: Sitemap dynamic slugs — **Missing API endpoints**
- ⏳ Test 13.4: Dynamic OG image generation — **Missing route handlers**
- ⏳ Test 13.6: Email preview server — **Missing HTTP server**

---

## Critical Blockers (High Priority)

### Blocker 1: Missing OG Image Generation Routes

**What's Missing:**
- `GET /api/og` — Default OG image with optional title parameter
- `GET /api/og/profile/{username}` — User profile OG image
- `GET /api/og/bounties/{id}` — Bounty OG image  
- `GET /api/og/grants/{id}` — Grant OG image
- `GET /api/og/blog/{slug}` — Blog post OG image

**Current State:**
- Code references these endpoints in layout metadata:
  ```tsx
  // apps/web/app/[locale]/grants/[id]/layout.tsx
  const image = `/api/og/grants/${id}`;
  ```
- But routes don't exist → 404 errors when images are requested
- Social media can't generate previews (falls back to default)

**Implementation Required:**
- Create `apps/web/app/api/og/route.ts` or refactor to `apps/api/app/api/og/*`
- Use `@vercel/og` library (already in dependencies)
- Generate 1200×630 PNG images with resource data
- Set cache headers: `Cache-Control: public, s-maxage=86400`

**Effort:** ~150 lines (template + 5 routes)

**Impact:** Without this, individual grants/bounties/profiles have no OG images for social sharing

---

### Blocker 2: Missing Sitemap Dynamic Slug Endpoints

**What's Missing:**
- `GET /api/v1/profiles/sitemap-slugs` — Array of profile slugs with updatedAt
- `GET /api/v1/organizations/sitemap-slugs` — Array of org slugs with updatedAt

**Current State:**
- Sitemap includes 15 static routes
- No dynamic profile or organization slugs in sitemap
- Search engines can't discover individual profiles/orgs → Lower SEO

**Implementation Required:**
```typescript
// apps/api/app/api/v1/profiles/sitemap-slugs/route.ts
export async function GET() {
  const profiles = await database.ecosystemProfile.findMany({
    where: { visibility: 'VERIFIED' },
    select: { slug: true, updatedAt: true },
  });
  return NextResponse.json(profiles);
}
```

Similar for organizations.

**Effort:** ~40 lines (2 routes)

**Impact:** Without this, ~100+ profiles/orgs are invisible to search engines

---

## Lower Priority Blockers

### Blocker 3: Email Template Preview Server

**What's Missing:**
- HTTP server exposing email templates at `http://localhost:3005`
- Template listing page
- Preview rendering for each template

**Current State:**
- Templates compile and type-check correctly ✅
- `packages/email/preview.tsx` exists but not exposed as HTTP server
- Can't visually preview emails in development

**Implementation Required:**
- Create Express or Next.js server in `packages/email/server.ts`
- Listen on port 3005
- List all templates with preview rendering
- Auto-reload on template changes

**Effort:** ~200 lines

**Impact:** Developers must rely on email tests/logs to verify templates. UX improvement only — not critical for functionality.

---

## Dependencies & Sequencing

**Critical Path (blocks Phase 13 completion):**
1. Implement OG image routes (1-2 hours)
2. Implement sitemap slug endpoints (30 mins)
3. Test all 9 Phase 13 tests (30 mins)
4. Mark Phase 13 complete

**Optional Path (nice-to-have):**
1. Build email preview server (separate PR/issue)
2. Link from dev docs

---

## Recommended Implementation Order

### Priority 1 (Do First)
✅ **OG Image Routes** — Impacts social sharing, user experience
- Affects: Bounty cards, grant pages, profile shares
- Test: Share a bounty URL on Twitter/Discord → see preview

✅ **Sitemap Slug Endpoints** — Impacts SEO, discoverability
- Affects: Search engine rankings for individual profiles/orgs
- Test: `curl http://localhost:3002/api/v1/profiles/sitemap-slugs`

### Priority 2 (Optional)
📧 **Email Preview Server** — Developer experience only
- Affects: Dev workflow, template testing
- Can be deferred to separate issue

---

## Testing Strategy for Follow-up PR

Once implementations are complete:

```bash
# Test OG image generation
curl -I http://localhost:3000/api/og/grants/abc123
# Expected: 200 OK, Content-Type: image/png

# Test dynamic sitemap slugs
curl http://localhost:3000/api/v1/profiles/sitemap-slugs
# Expected: [{ slug: "alice", updatedAt: "2026-04-07T..." }, ...]

# Test updated sitemap includes dynamic entries
curl http://localhost:3000/sitemap.xml | grep alice
# Expected: <loc>http://localhost:3000/profile/alice</loc>
```

---

## Files to Create/Modify

**New Files:**
- `apps/web/app/api/og/route.ts` — Default OG endpoint
- `apps/web/app/api/og/[...slug]/route.ts` — Dynamic OG routes
- `apps/api/app/api/v1/profiles/sitemap-slugs/route.ts` — Profile slugs
- `apps/api/app/api/v1/organizations/sitemap-slugs/route.ts` — Org slugs

**Files to Modify:**
- `apps/web/app/sitemap.ts` — Add dynamic entries from slug endpoints

---

## Known Issues

None for existing functionality. All passing tests are stable.

---

## Next Steps

1. **Phase 13 Status Update** → Mark as "6/9 TESTED, 3/9 PENDING"
2. **Create Follow-up Issue** → "Implement OG image routes and sitemap slug endpoints"
3. **Continue Testing** → Proceed to Phase 14 (Security & Access) — not blocked
4. **Implementation** → Can happen in parallel with Phase 14 testing

---

**Generated:** 2026-04-07 12:16 UTC  
**Task ID:** phase-13-og-seo  
**Author:** Anvil (Phase 13 Test Runner)
