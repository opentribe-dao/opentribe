# Phase 12: Production Seeding — Test Prompt

**Phase:** 12  
**Feature:** Production Seeding (W3F Kusama Data)  
**Scope:** Verify production-safe seed scripts and permission gates  
**Duration:** ~1-2 hours

---

## Overview

Phase 12 validates the **production seeding system** for Web3 Foundation Kusama ecosystem data. This includes:
1. **Production seed script** execution (upsert logic, not replace)
2. **Permission gates** (ALLOW_PRODUCTION_SEED_UPSERT flag)
3. **Data verification** (grants, RFPs, organization created correctly)
4. **Slug generation** (auto-generated from names)

**Key Files:**
- `packages/db/seed-production.ts` — Main seed script
- `packages/db/production-seed-data.ts` — W3F Kusama data (org, grants, RFPs)

---

## Prerequisites

1. ✅ Phase 11 complete (Org Claim System tested)
2. ✅ All servers running (`pnpm dev` at root)
3. ✅ PostgreSQL running and accessible
4. ✅ Current schema migrations applied (`pnpm migrate`)
5. ✅ Environment variables configured in `apps/api/.env.local`

---

## Tests

### Test 12.1: Production Seed Script Execution

**Objective:** Verify the production seed script runs without errors and creates expected data.

**Setup:**
```bash
# Verify environment
echo $DATABASE_URL  # Should output PostgreSQL connection string
```

**Step 1: Run seed-production script**
```bash
cd /Users/tarun/Downloads/projects/opentribe/packages/db

# Run in dev environment (no permission flag needed)
DATABASE_URL="postgresql://tarun@localhost:5432/opentribe" pnpm db:seed:production
```

**Expected Output:**
```
✅ Web3 Foundation organization upserted
✅ Proof of Personhood Bounty grant upserted (slug: proof-of-personhood-bounty)
✅ Kusama ZK Bounty grant upserted (slug: kusama-zk-bounty)
✅ Kusama Art & Social grant upserted (slug: kusama-art-and-social)
✅ Privacy OS RFP upserted (slug: privacy-os)
🎉 Production seed completed successfully!
```

**Evidence to Capture:**
- Terminal output showing all grants and RFPs created
- Save as: `12.1-seed-output.txt`

---

### Test 12.2A: Organization Created Correctly

**Objective:** Verify Web3 Foundation organization was created with correct properties.

**Step 1: Query database**
```bash
psql "postgresql://tarun@localhost:5432/opentribe" -t -c "
SELECT 
  id,
  name,
  slug,
  orgType,
  isVerified,
  visibility,
  managedByPlatform,
  claimableBy,
  'ecosystemSource' as field
FROM organization
WHERE slug = 'web3-foundation'
LIMIT 1;
"
```

**Expected Output:**
```
 id | name | slug | orgType | isVerified | visibility | managedByPlatform | claimableBy
 ... | Web3 Foundation | web3-foundation | FOUNDATION | true | VERIFIED | true | github:w3f
```

**Verification Checklist:**
- ✅ name: "Web3 Foundation"
- ✅ slug: "web3-foundation"
- ✅ orgType: "FOUNDATION"
- ✅ isVerified: true
- ✅ visibility: "VERIFIED"
- ✅ managedByPlatform: true (no owner user required)
- ✅ claimableBy: "github:w3f"

**Evidence to Capture:**
- Screenshot or save output: `12.2a-org-created.json`

---

### Test 12.2B: Grants Created with Correct Data

**Objective:** Verify all 3 Kusama Vision grants were created with correct properties.

**Step 1: Query grants**
```bash
psql "postgresql://tarun@localhost:5432/opentribe" -c "
SELECT 
  id,
  title,
  slug,
  externalId,
  fundingAmount,
  fundingCurrency,
  status
FROM grant
WHERE slug LIKE 'kusama%' OR slug LIKE 'proof%'
ORDER BY slug;
" | tee 12.2b-grants.txt
```

**Expected Grants:**
| Slug | Title | Funding | Status |
|------|-------|---------|--------|
| `proof-of-personhood-bounty` | Proof of Personhood Bounty | 5M DOT | ACTIVE |
| `kusama-zk-bounty` | Kusama ZK Bounty | 5M DOT | ACTIVE |
| `kusama-art-and-social` | Kusama Art & Social | 10M DOT (across 10 projects) | ACTIVE |

**Verification Checklist:**
- ✅ 3 grants created
- ✅ Slugs auto-generated from titles
- ✅ externalId values set (kusama:*)
- ✅ All ACTIVE status
- ✅ Funding amounts correct

**Evidence to Capture:**
- Query output: `12.2b-grants-created.json`

---

### Test 12.3: RFP Created (Privacy OS)

**Objective:** Verify Privacy OS RFP was created and linked to ZK bounty.

**Step 1: Query RFP**
```bash
psql "postgresql://tarun@localhost:5432/opentribe" -c "
SELECT 
  id,
  title,
  slug,
  status,
  createdAt
FROM rfp
WHERE slug = 'privacy-os';
" | tee 12.3-rfp.txt
```

**Expected Output:**
```
 id | title | slug | status | createdAt
 ... | Privacy OS | privacy-os | ACTIVE | ...
```

**Verification Checklist:**
- ✅ Title: "Privacy OS"
- ✅ Slug: "privacy-os"
- ✅ Status: ACTIVE

**Evidence to Capture:**
- Query output: `12.3-rfp-created.json`

---

### Test 12.4: Existing Data Preserved (Upsert, not Replace)

**Objective:** Verify running seed again preserves existing grants and doesn't duplicate data.

**Setup:**
```bash
# Count grants before second seed
psql "postgresql://tarun@localhost:5432/opentribe" -t -c "
SELECT COUNT(*) FROM grant WHERE slug LIKE 'kusama%' OR slug LIKE 'proof%';
" > /tmp/grant_count_before.txt

# Run seed again
DATABASE_URL="postgresql://tarun@localhost:5432/opentribe" pnpm db:seed:production

# Count grants after second seed
psql "postgresql://tarun@localhost:5432/opentribe" -t -c "
SELECT COUNT(*) FROM grant WHERE slug LIKE 'kusama%' OR slug LIKE 'proof%';
" > /tmp/grant_count_after.txt
```

**Expected Result:**
- Count before: 3
- Count after: 3 (no duplicates created)

**Evidence to Capture:**
- Before/after counts: `12.4-upsert-check.json`

---

### Test 12.5: Permission Gate — Dev Environment

**Objective:** Verify script runs without ALLOW_PRODUCTION_SEED_UPSERT flag in dev.

**Step 1: Run script (should succeed)**
```bash
NODE_ENV=development DATABASE_URL="postgresql://tarun@localhost:5432/opentribe" \
  pnpm db:seed:production
```

**Expected Output:**
- ✅ Completes successfully (dev environment doesn't require flag)

**Evidence to Capture:**
- Terminal output: `12.5-dev-permission.txt`

---

### Test 12.6: Permission Gate — Production Environment (Blocked)

**Objective:** Verify script fails in production without ALLOW_PRODUCTION_SEED_UPSERT flag.

**Step 1: Simulate production (should fail)**
```bash
NODE_ENV=production DATABASE_URL="postgresql://tarun@localhost:5432/opentribe" \
  pnpm db:seed:production 2>&1 || echo "Failed as expected"
```

**Expected Output:**
```
Error: seed-production.ts requires ALLOW_PRODUCTION_SEED_UPSERT=true in production
```

**Evidence to Capture:**
- Error output: `12.6-production-blocked.txt`

---

### Test 12.7: Permission Gate — Production Environment (Allowed)

**Objective:** Verify script succeeds in production WITH ALLOW_PRODUCTION_SEED_UPSERT flag.

**Step 1: Run with permission flag**
```bash
NODE_ENV=production \
  ALLOW_PRODUCTION_SEED_UPSERT=true \
  DATABASE_URL="postgresql://tarun@localhost:5432/opentribe" \
  pnpm db:seed:production
```

**Expected Output:**
- ✅ Completes successfully (permission flag provided)

**Evidence to Capture:**
- Terminal output: `12.7-production-allowed.txt`

---

## Summary

**Tests 12.1-12.7 verify:**
- ✅ Production seed script executes without errors
- ✅ Web3 Foundation organization created correctly
- ✅ All 3 Kusama grants created with correct data
- ✅ Privacy OS RFP created
- ✅ Upsert logic (no duplicates on re-run)
- ✅ Permission gate blocks production without flag
- ✅ Permission gate allows production with flag

**Success Criteria:**
- All 7 tests pass
- No errors in seed execution
- Data verification matches expected values
- Permission gates work as designed

---

## Evidence Folder

Create and organize evidence in: `.pr151-test-assets/screenshots/phase-12/`

Evidence files to capture:
- `12.1-seed-output.txt` — Seed script execution output
- `12.2a-org-created.json` — Organization record from database
- `12.2b-grants-created.json` — All 3 grants from database
- `12.3-rfp-created.json` — RFP record from database
- `12.4-upsert-check.json` — Before/after grant counts
- `12.5-dev-permission.txt` — Dev environment success
- `12.6-production-blocked.txt` — Production blocked without flag
- `12.7-production-allowed.txt` — Production allowed with flag

---

## Notes

1. **Database Connection:** All commands use `DATABASE_URL="postgresql://tarun@localhost:5432/opentribe"`
2. **Idempotent:** Seed can be run multiple times without creating duplicates (upsert pattern)
3. **Permission Model:** Dev environment always allowed; production requires explicit flag
4. **No Owner Required:** Web3 Foundation is `managedByPlatform: true`, so no user owner is assigned

---

## Execution Workflow

```
1. Verify prerequisites
2. Run Test 12.1 (seed execution)
3. Run Test 12.2A (org verification)
4. Run Test 12.2B (grants verification)
5. Run Test 12.3 (RFP verification)
6. Run Test 12.4 (upsert verification)
7. Run Test 12.5 (dev permission)
8. Run Test 12.6 (production blocked)
9. Run Test 12.7 (production allowed)
10. Collect all evidence files
11. Update PR151_TEST_CHECKLIST.md with results
12. Commit and proceed to Phase 13
```

---

**Ready to begin Phase 12 testing. Start with Test 12.1: Production Seed Script Execution.**
