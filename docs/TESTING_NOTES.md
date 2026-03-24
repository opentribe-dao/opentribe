# Testing Notes — Ecosystem Pre-Population

## Test Date: 2026-03-25
## Branch: feat/admin-app
## Test Data: 7 users, 6 orgs, 7 grants, 3 bounties, 46 ecosystem profiles, 20 imported apps, 17 meetup curators

---

## Bugs Found

### Critical (Blocking)
| # | Page | Issue | Status | Fix |
|---|------|-------|--------|-----|
| B1 | Admin Dashboard | Stats cards stuck on loading — cross-origin cookie not sent from 3003→3002 | FIXED | Added Next.js rewrite proxy in admin next.config.ts + relative URLs in admin API client |
| B2 | Organizations page | `_count.grants` undefined crash — API didn't include `_count` in response | FIXED | Added `_count` to Prisma query + optional chaining in component |
| B3 | Ecosystem Profile | `status.toUpperCase()` crash — contribution status undefined from API | FIXED | Added null guards to `formatStatus` and `getStatusColor` |
| B4 | Email port conflict | React Email grabbed port 3003 before admin app | FIXED | Changed `packages/email/package.json` dev port to 3005 |

### Medium (Functional but incorrect)
| # | Page | Issue | Status |
|---|------|-------|--------|
| B5 | Admin Dashboard | Sign-in redirect doesn't return to admin app (cross-domain cookie issue between localhost:3000 and localhost:3003) | OPEN |
| B6 | Organizations page | Counter shows "0 organizations found" but displays 1 card (stale Next.js server-side cache from before API fix) | OPEN — clears after 300s cache expiry |
| B7 | Organizations page | Only showing ACTIVE orgs initially — VERIFIED orgs (Web3 Foundation) not showing until cache refreshes | FIXED — added VERIFIED to visibility filter |
| B8 | Ecosystem Profile | Contribution card shows "Role: APPLICANT" without grant application title | OPEN — API doesn't include nested grantApplication.title in contribution response |
| B9 | Homepage | "Failed to load sidebar data / Failed to fetch homepage stats" error in sidebar | PRE-EXISTING — not from our changes |
| B10 | Build | 5 nullable userId type errors in existing code after schema change | FIXED — added optional chaining in 5 files |

### Low (Polish)
| # | Page | Issue | Status |
|---|------|-------|--------|
| P1 | Ecosystem Profile | Source badge shows raw enum `W3F_GRANTS` instead of friendly `W3F Grants` | OPEN |
| P2 | Ecosystem Profile | No skills displayed (skills array not populated during import for profiles) | OPEN — import only sets skills on GrantApplication, not EcosystemProfile |
| P3 | Ecosystem Profile | GitHub/website icons visible but not clearly labeled | OPEN |
| P4 | Organizations page | No org type badges displayed on cards (type field exists but not rendered) | OPEN |
| P5 | Admin | Stats card numbers not loading — may need to check if admin stats API returns correct shape | OPEN |
| P6 | Claim flow | Not testable yet — needs wallet extension or GitHub OAuth which aren't available in this test environment | DEFERRED |

---

## Pages Tested

### Public Web (localhost:3000)
| Page | URL | Result |
|------|-----|--------|
| Homepage | `/` | Working — bounties, grants visible. Sidebar stats error (pre-existing) |
| Organizations directory | `/organizations` | Working after fixes — search, type filters, glass morphism cards |
| Organization detail | `/organizations/web3-foundation` | NOT TESTED YET |
| Ecosystem profile | `/profile/h4n0` | Working — name, avatar, source badge, GitHub link, claim CTA, contributions |
| Profile SEO | `/profile/h4n0` (tab title) | Working — "Han Zhao | Opentribe Profile | Opentribe" |
| Grants listing | `/grants` | NOT TESTED YET |
| Grant detail | `/grants/{id}` | NOT TESTED YET |
| Grant app history | `/grants/{id}/applications` | NOT TESTED YET |
| Claim page | `/profile/claim/{slug}` | NOT TESTED YET |

### Admin (localhost:3003)
| Page | URL | Result |
|------|-----|--------|
| Dashboard | `/` | Loads — sidebar works, stats cards shimmer (data not loading) |
| Users | `/users` | NOT TESTED YET |
| Organizations | `/organizations` | NOT TESTED YET |
| Grants | `/grants` | NOT TESTED YET |
| Bounties | `/bounties` | NOT TESTED YET |
| Ecosystem Profiles | `/profiles` | NOT TESTED YET |
| Claims | `/claims` | NOT TESTED YET |
| Imports | `/imports` | NOT TESTED YET |
| Settings | `/settings` | NOT TESTED YET |

### API Endpoints
| Endpoint | Result |
|----------|--------|
| `GET /api/v1/profiles/h4n0/public` | Working — returns ecosystem profile data |
| `GET /api/v1/organizations` | Working — returns orgs with `_count` after fix |
| `GET /api/v1/ecosystem/profiles` | NOT TESTED YET |
| `GET /api/v1/admin/stats` | NOT TESTED YET — likely the cause of dashboard loading issue |
| `GET /api/v1/admin/users` | NOT TESTED YET |
| `GET /api/v1/admin/ecosystem-profiles` | NOT TESTED YET |

---

## Fixes Applied During Testing
1. `apps/api/app/api/v1/organizations/route.ts` — Added `_count`, search, type filter, VERIFIED visibility
2. `apps/web/app/[locale]/organizations/components/organizations-directory.tsx` — Optional chaining on `_count`
3. `apps/web/app/[locale]/profile/[username]/components/ecosystem-profile.tsx` — Null guards on status functions
4. `packages/email/package.json` — Port 3003 → 3005
5. Earlier build fixes: 5 nullable userId type errors, auth-modal component, polkadot dep versions
