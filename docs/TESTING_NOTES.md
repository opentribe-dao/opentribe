# Testing Notes — Ecosystem Pre-Population

## Test Date: 2026-03-25
## Branch: feat/admin-app
## Test Data: 8 users, 6 orgs, 8 grants, 3 bounties, 121 ecosystem profiles (103 W3F + 17 meetup + 1 Relaycode), 21 imported apps

---

## Bugs Fixed During Testing

| # | Page | Issue | Fix |
|---|------|-------|-----|
| F1 | Build | `@polkadot/extension-dapp@^0.56.3` not found | Updated to `^0.62.6` |
| F2 | Build | 5 nullable `userId` type errors after schema change | Added optional chaining in 5 API files |
| F3 | Build | `milestones` Json field removed but POST handler still referenced it | Removed reference |
| F4 | Build | `admin-auth.ts` user.role type error | Cast via `(session.user as any).role` |
| F5 | Build | Missing `auth-modal` component for claim page | Created component |
| F6 | Organizations dir | `_count.grants` undefined crash | Added `_count` to Prisma query + optional chaining |
| F7 | Organizations detail | `grant._count.applications` crash | Used `applicationCount` field + optional chaining |
| F8 | Ecosystem profile | `status.toUpperCase()` crash on null | Added null guards to `formatStatus`/`getStatusColor` |
| F9 | Email port conflict | React Email on port 3003 blocked admin app | Changed email dev port to 3005 |
| F10 | Admin dashboard | Stats shimmer — cross-origin cookie not sent 3003→3002 | Added Next.js rewrite proxy + relative URLs in admin API client |
| F11 | Auth cookies | `secure: true` on HTTP localhost blocked cookies | Env-based config: `secure=false`, `sameSite=lax` for dev |
| F12 | User profile | `profile.data.user.name` crash — API returns flat data | Handle both `.user` wrapper and flat response |
| F13 | User profile | `isOwnProfile` undefined | Optional chaining with `?? false` |
| F14 | Grant apps page | `grant.slug` crash — API doesn't include grant wrapper | Fetch grant info separately |
| F15 | Grant apps API | Query used URL slug param instead of `grant.id` | Changed `grantId` to `grant.id` in Prisma query |
| F16 | Username/slug collision | User profile hides ecosystem claim CTA | Resolver returns `claimableProfile` alongside user data; claim banner in UserProfile |
| F17 | Claim page | "Profile not found" when slug matches User | Claim page now searches ecosystem profiles directly |
| F18 | User profile Activity | Empty after claim — no applications shown | UserProfile fetches full data client-side from `/api/v1/users/:username` |
| F19 | Ecosystem Contributions duplicate | Same application in Activity AND Ecosystem Contributions | Filter out backfilled apps from Ecosystem section |
| F20 | Activity card links | `grant.slug` crash on click | Optional chaining + fallback to grant ID |
| F21 | Grant detail | "21 applications" badge not clickable | Changed to Link pointing to `/applications` |

---

## Known Issues (Not Yet Fixed)

### Data Quality
| # | Issue | Impact | Fix Needed |
|---|-------|--------|-----------|
| D1 | **Application dates show import date (Mar 25, 2026)** not actual W3F acceptance date | All 21 imported apps show wrong date | Import script should fetch commit dates from GitHub API: `GET /repos/w3f/Grants-Program/commits?path=applications/{file}.md` — first commit = submitted, merge commit = accepted |
| D2 | Parser: section headers parsed as team members ("Team's Experience", "Code Repos", "Team Website") | ~10 junk profiles in DB | Add exclusion list to `parseTeamMembersList()` for known section header patterns |
| D3 | Parser: duplicate profiles (name includes role text, dedup fails) | Valeria Caracciolo appears 3x | Improve name-role separation in `parseTeamMemberLine()` |
| D4 | Parser: names include role descriptions ("Brady Liu, Project Tech Lead") | Messy display names | Truncate at comma/dash for role separation |
| D5 | Source badges show raw enum `W3F_GRANTS` | Unfriendly display | Add source label formatter |
| D6 | Ecosystem profile contributions show "Role: APPLICANT" without grant title | Missing context | API should include `grantApplication.title` in contribution response |
| D7 | Grant applications page shows "by Unknown" in header | Missing org name | Need to include `organization.name` in grant detail fetch |
| D8 | **External grant detail shows "Grant Prize: Variable"** | Misleading — external grants don't have amounts | Hide prize/validity cards for EXTERNAL grants without amounts, or show "Varies by application" |
| D9 | **External grant shows fake validity dates (Mar 25 - Jun 25)** | Dates are auto-generated from publishedAt, not real | External grants should show "Rolling" or "No deadline" instead of fake 3-month range |
| D10 | External grant shows "0 applications" badge | W3F Grants Program has 21 imported apps but Kusama grants have 0 | Kusama grants are EXTERNAL with external application URL — 0 is correct for native apps, but confusing. Consider showing "External Applications" instead |

### Infrastructure
| # | Issue | Impact | Fix Needed |
|---|-------|--------|-----------|
| I1 | Stats endpoints (bounties/grants/rfps) return 500 | Sidebar stats error on homepage | **FIXED** — graceful Redis fallback added to all 7 endpoints |
| I2 | Sitemap slug endpoints return 404 | Dynamic sitemap entries missing | Create `/api/v1/profiles/sitemap-slugs` and `/api/v1/organizations/sitemap-slugs` endpoints |
| I3 | Server-side cache (`revalidate: 300`) causes stale data during testing | Fixes not visible immediately | Reduced to 60s for applications page; other pages still 300s |

### Claim Flow
| # | Issue | Impact | Fix Needed |
|---|-------|--------|-----------|
| C1 | Email claim not testable | No Resend key configured locally | Need Resend API key in `.env.local` |
| C2 | Wallet claim not testable | Needs Polkadot wallet extension | Test in staging with Talisman |
| C3 | Admin claim approval UI | Not tested — no claims in queue to review | Create a test claim manually |

---

## Fully Tested & Passing

### Public Web
- Homepage with bounties/grants
- Organizations directory (search, type filters)
- Organization detail (Web3 Foundation — grants, links, verified badge, team)
- Ecosystem profile (`/profile/h4n0`) — name, source badge, claim CTA, contributions
- User profile (`/profile/alice_substrate`) — name, bio, skills, activity, stats
- User profile after claim (`/profile/itsyogesh`) — shows Relaycode in Activity
- Grant detail page — 21 applications badge, info cards
- **Grant applications list — 21 W3F applications with applicant names, avatars, status badges**
- Profile SEO metadata (correct title in tab)
- OG image generation (returns 200)
- Claim flow: GitHub OAuth auto-verification with account ID match
- Post-claim: data merge, userId backfill, profile activity update

### Admin App (localhost:3003)
- Dashboard stats (7 users, 4 orgs, 8 grants, 120 profiles)
- Users page (7 users, role badges, filters)
- Organizations page (4 orgs, type badges, verified status)
- Organization detail (Web3 Foundation — admin controls, members with roles)
- Grants page (8 grants, status/source badges, app counts)
- Bounties page (3 bounties, amounts, status)
- Ecosystem Profiles (120 profiles, search, filters)
- Claims queue (empty, tabs working)
- Imports page (2 completed W3F jobs)
- Admin auth (superadmin only, redirects unauthenticated)

### Schema & Data
- All 6 new tables verified
- All 9 new enums verified
- Organization fields (orgType, managedByPlatform, ecosystemSource)
- Grant fields (externalId, fundingSource, onChainRef)
- Production seed safety flag
- Import pipeline (514 W3F apps, 23 Fast Grants, 10 Open Source — 0 errors)

---

## Claim Flow Test — End-to-End Verified

1. Imported Relaycode W3F application → created ecosystem profile for Yogesh Kumar
2. Resolved GitHub account ID (1210943) from API
3. Signed up with GitHub OAuth → Better Auth stored Account.accountId = "1210943"
4. Navigated to `/profile/itsyogesh` — saw user profile with claim banner
5. Clicked "Claim this profile" → claim page found ecosystem profile despite slug collision
6. Selected GitHub method → API compared Account.accountId with EcosystemProfile.githubAccountId
7. Match → auto-verified (ClaimRequest status: VERIFIED, matchType: github_account_id)
8. Post-claim: EcosystemProfile.claimedByUserId set, github merged into user, GrantApplication.userId backfilled
9. Profile Activity shows "Relaycode: An Improved Extrinsics Builder for Polkadot — Applied to Web3 Foundation — APPROVED"
