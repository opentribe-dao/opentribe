# Phase 9 Test Prompt: API — Stats & Redis Fallback

**Objective**: Validate all stats endpoints (`/api/v1/{bounties,grants,rfps,home}/stats`) work correctly with Redis caching enabled, and gracefully degrade when Redis is unavailable.

**Branch**: `feat/admin-app`  
**Ports**: Web (3000), API (3002), Dashboard (3001), Admin (3003)  
**Database**: PostgreSQL (with seed data from Phases 0–8)  
**Cache**: Upstash Redis (or disabled for fallback testing)

---

## Test Coverage Overview

| Section | Tests | Coverage | Known Issues | Dependencies |
|---------|-------|----------|--------------|--------------|
| 9.1 - Stats Endpoints (WITH Redis) | 4 tests | 0% | Unknown | Redis configured, seed data loaded |
| 9.2 - Redis Fallback (WITHOUT Redis) | 3 tests | 0% | Unknown | Database connectivity, no Redis |
| 9.3 - Claim Expiry (Deferred 7.6) | 1 test | 0% | Database fixture setup required | Timestamp manipulation via SQL |
| **Total** | **8 tests** | **0%** | **Target: 70%+ coverage** | See dependencies |

---

## Prerequisites

### Environment Checklist
- [ ] PostgreSQL running and accessible
- [ ] Seed data from Phases 0–8 loaded (8 users, 4 organizations, 3 grants, bounties, claims)
- [ ] `.env.local` files exist in `apps/api/`, `apps/web/`, `apps/dashboard/`, `apps/admin/`
- [ ] API server running on port 3002 (`pnpm dev` or `pnpm --filter api dev`)
- [ ] Upstash Redis configured (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN in `.env.local`)
- [ ] Chrome browser available (headful, not headless, for inspection)

### Session Requirements
- [ ] Admin session authenticated (Phases 3–8 login flow verified working)
- [ ] Public web accessible (Phase 8 public routes verified)
- [ ] Database connectivity verified (`psql $DATABASE_URL -c "SELECT 1;"`)

---

## 9.1: Stats Endpoints (WITH Redis Configured)

**Objective**: Verify all stats endpoints return correct data structure and leverage Redis cache.

**Setup**: Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set in `apps/api/.env.local`.

### Test 9.1.1: Bounties Stats Endpoint

**URL**: `GET http://localhost:3002/api/v1/bounties/stats`

**Steps**:
1. Open Chrome DevTools → Network tab
2. Call endpoint: `curl http://localhost:3002/api/v1/bounties/stats`
3. Inspect response status and body
4. Check response time (should be fast if cached, ~50-200ms)
5. Verify no errors in API logs

**Expected Response**:
```json
{
  "total_bounties_count": NUMBER,
  "total_rewards": STRING (formatted currency or total in base unit),
  "cached": BOOLEAN (true if from Redis, false if from DB),
  "cache_ttl": NUMBER (seconds until expiry)
}
```

**Success Criteria**:
- [ ] Status code: 200 OK
- [ ] `total_bounties_count` > 0 (seed data has bounties)
- [ ] `total_rewards` present (numeric or formatted string)
- [ ] `cached` field present
- [ ] Response time < 300ms (indicates caching working)
- [ ] No 500 errors in API logs

**Known Issues**: None documented. Monitor for Redis connection timeouts.

---

### Test 9.1.2: Grants Stats Endpoint

**URL**: `GET http://localhost:3002/api/v1/grants/stats`

**Steps**:
1. Clear browser cache (or use incognito)
2. Call endpoint: `curl http://localhost:3002/api/v1/grants/stats`
3. Inspect response and timing
4. Call endpoint again within 60 seconds — should be faster (cached)

**Expected Response**:
```json
{
  "total_grants_count": NUMBER,
  "total_funds": STRING,
  "cached": BOOLEAN,
  "cache_ttl": NUMBER
}
```

**Success Criteria**:
- [ ] Status code: 200 OK
- [ ] `total_grants_count` ≥ 3 (seed data has grants)
- [ ] `total_funds` present
- [ ] First call: `cached: false`
- [ ] Second call (within 60s): `cached: true` (or response time much faster)
- [ ] No 500 errors

---

### Test 9.1.3: RFPs Stats Endpoint

**URL**: `GET http://localhost:3002/api/v1/rfps/stats`

**Steps**:
1. Call endpoint: `curl http://localhost:3002/api/v1/rfps/stats`
2. Verify response structure

**Expected Response**:
```json
{
  "total_rfps_count": NUMBER,
  "total_grants_count": NUMBER,
  "cached": BOOLEAN,
  "cache_ttl": NUMBER
}
```

**Success Criteria**:
- [ ] Status code: 200 OK
- [ ] Both count fields present
- [ ] Counts are realistic (≥ 0)
- [ ] No 500 errors

---

### Test 9.1.4: Home Stats Endpoint

**URL**: `GET http://localhost:3002/api/v1/home/stats`

**Steps**:
1. Open public website: `http://localhost:3000`
2. Inspect sidebar or hero section stats (if displayed)
3. Call API directly: `curl http://localhost:3002/api/v1/home/stats`
4. Compare with UI display

**Expected Response**:
```json
{
  "total_builders": NUMBER,
  "total_organizations": NUMBER,
  "total_bounties": NUMBER,
  "total_grants": NUMBER,
  "total_rfps": NUMBER,
  "total_rewards": STRING,
  "total_funding": STRING,
  "cached": BOOLEAN,
  "cache_ttl": NUMBER
}
```

**Success Criteria**:
- [ ] Status code: 200 OK
- [ ] All stat fields present
- [ ] Counts > 0 (seed data has data)
- [ ] UI matches API response (if stats displayed on homepage)
- [ ] Response time < 300ms

---

## 9.2: Redis Fallback Verification

**Objective**: Verify stats still work when Redis is unavailable (graceful degradation).

### Test 9.2.1: Stats WITH Redis Enabled

**Steps**:
1. Ensure `UPSTASH_REDIS_REST_URL` is set in `apps/api/.env.local`
2. Restart API server: `pnpm --filter api dev`
3. Call all 4 stats endpoints
4. Record response times (WITH cache)

**Expected**: Fast responses (~50-200ms), `cached: true` after first call

---

### Test 9.2.2: Stats WITHOUT Redis (Fallback to Database)

**Steps**:
1. Comment out `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `apps/api/.env.local`
2. Restart API server: `pnpm --filter api dev`
3. Call all 4 stats endpoints
4. Record response times (NO cache, direct DB query)

**Expected**:
- [ ] All endpoints still return 200 OK (no 500 errors)
- [ ] Response times slower (~200-800ms) but acceptable
- [ ] `cached: false` for all responses
- [ ] Data accuracy same as with Redis

---

### Test 9.2.3: Graceful Degradation (Error Handling)

**Steps**:
1. Simulate Redis error: Set invalid `UPSTASH_REDIS_REST_URL` (e.g., `https://invalid-url.upstash.io`)
2. Restart API server
3. Call all stats endpoints
4. Check API logs for error handling

**Expected**:
- [ ] No 500 errors (errors caught and logged, not thrown)
- [ ] Endpoints still return 200 OK with data from DB
- [ ] Logs show: `[WARN] Redis connection failed, using fallback DB query`
- [ ] Response times slower (DB only)

---

## 9.3: Claim Expiry Test (Deferred 7.6)

**Objective**: Verify claims expire after 7 days and become inaccessible.

### Test 9.3.1: Claim Expiry with Timestamp Manipulation

**Setup**: Create a test claim and manipulate its `created_at` timestamp to 7+ days ago.

**Steps**:
1. Create a new claim via API or UI (Phase 7 flow)
2. Query database to find claim ID: `SELECT id FROM claims WHERE user_id = {user_id} ORDER BY created_at DESC LIMIT 1;`
3. Update claim timestamp to 7+ days ago:
   ```sql
   UPDATE claims SET created_at = NOW() - INTERVAL '8 days' WHERE id = {claim_id};
   ```
4. Attempt to view/verify claim via API or UI
5. Verify claim is marked as expired or inaccessible

**Expected**:
- [ ] Claim creation succeeds (normal flow)
- [ ] Timestamp update succeeds
- [ ] Attempt to access expired claim returns 410 Gone or 403 Forbidden
- [ ] Error message: "Claim has expired" or similar
- [ ] UI shows "This claim has expired" message

**Success Criteria**:
- [ ] Expired claims cannot be accessed
- [ ] Non-expired claims still accessible
- [ ] Expiry boundary tested (at 7 days exactly)

---

## Testing Checklist

### Pre-Test
- [ ] PostgreSQL running: `pg_isready -h localhost`
- [ ] API server running: `pnpm --filter api dev` (port 3002)
- [ ] Database seed data loaded (verified in Phase 0)
- [ ] `.env.local` files configured
- [ ] Chrome available for inspection

### During Tests
- [ ] Record all response times and status codes
- [ ] Screenshot API responses (for evidence)
- [ ] Note any error messages or warnings
- [ ] Test both WITH and WITHOUT Redis for full coverage

### Post-Test
- [ ] Update PR151_TEST_CHECKLIST.md with results
- [ ] Mark tests as ✅ PASS or ❌ FAIL
- [ ] Document any findings or issues
- [ ] Commit changes with clear commit message

---

## Success Metrics

- **9.1**: All 4 stats endpoints return 200 OK with correct structure → 4/4 tests pass
- **9.2**: Stats work with AND without Redis, graceful degradation → 3/3 tests pass
- **9.3**: Claims expire after 7 days, inaccessible when expired → 1/1 test passes

**Overall Target**: 8/8 tests passing (100% coverage for Phase 9)

---

## Notes

1. **Redis Caching**: Don't manually clear Redis between tests. Let TTL expire naturally (observe cache behavior).
2. **Database Fixtures**: Seed data from Phases 0–8 should provide enough data for realistic stats.
3. **Claim Expiry**: Requires direct database manipulation (SQL). Use `psql` or any SQL client.
4. **Chrome DevTools**: Open for inspection, but tests are API-level (can use curl or Postman).

---

**Next Steps**:
1. ✅ Create this prompt (PHASE_9_TEST_PROMPT.md)
2. → Execute tests 9.1–9.3
3. → Capture evidence (screenshots, API responses)
4. → Update PR151_TEST_CHECKLIST.md
5. → Proceed to Phase 10 (Admin Endpoints)

