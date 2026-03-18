# Prisma 7.x Migration Guide

**Status:** Pending - Scheduled for dedicated sprint
**Date:** March 18, 2026
**Current Version:** Prisma 6.19.0
**Target Version:** Prisma 7.5.0

## Why Upgrade?

### Security Fixes
- Multiple vulnerability patches between 6.19.0 and 7.5.0
- Improved query safety
- Better TypeScript type safety

### New Features
- Improved performance for large datasets
- Better error messages
- Enhanced migration system

## Breaking Changes in Prisma 7.x

### 1. Datasource Configuration (Major)

**Before (schema.prisma):**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**After (prisma.config.ts):**
```typescript
import path from 'node:path';
import type { PrismaConfig } from 'prisma';

export default {
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrate: {
    adapter: async () => {
      // Your database adapter
    },
  },
} satisfies PrismaConfig;
```

**PrismaClient initialization:**
```typescript
// Before
const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } }
});

// After
const prisma = new PrismaClient({
  adapter: yourDatabaseAdapter
});
```

### 2. $queryRaw Changes

The `$queryRaw` and `$executeRaw` APIs have changed:
- No longer accepts template strings directly in some contexts
- Requires explicit parameter passing
- Check all usages in `apps/api/` and `packages/db/`

### 3. Adapter Changes

If using database adapters (Neon, Prisma Accelerate, etc.):
- Adapters must be passed to `PrismaClient` constructor
- Some adapter APIs have changed

## Migration Steps

### Phase 1: Preparation
1. [ ] Read Prisma 7 migration guide: https://pris.ly/d/migrate-to-prisma-7
2. [ ] Review all PrismaClient usages
3. [ ] Identify database adapter requirements
4. [ ] Set up staging environment for testing

### Phase 2: Configuration Changes
1. [ ] Create `prisma.config.ts` with datasource configuration
2. [ ] Remove `url` from `schema.prisma` datasource
3. [ ] Update all PrismaClient initializations
4. [ ] Update database adapter configuration

### Phase 3: Query Changes
1. [ ] Review all `$queryRaw` usages
2. [ ] Update raw queries to new API
3. [ ] Test all database operations

### Phase 4: Testing
1. [ ] Run all existing tests
2. [ ] Add integration tests for database operations
3. [ ] Perform end-to-end testing
4. [ ] Test with production data in staging

### Phase 5: Deployment
1. [ ] Deploy to staging
2. [ ] Run migrations
3. [ ] Verify all functionality
4. [ ] Deploy to production

## Affected Files

### Must Update:
- `packages/db/prisma/schema.prisma` - Remove url from datasource
- `packages/db/index.ts` - Update PrismaClient initialization
- `apps/api/lib/database.ts` - Update client config
- Any file using `$queryRaw` or `$executeRaw`

### Review for Changes:
- All API routes using database
- Any raw SQL queries
- Database migration files

## Rollback Plan

If migration fails:
1. Revert to Prisma 6.x in package.json
2. Re-add datasource url to schema.prisma
3. Revert PrismaClient changes
4. Deploy to production

## Testing Checklist

- [ ] User creation and authentication
- [ ] Bounty CRUD operations
- [ ] Grant CRUD operations
- [ ] Submission workflows
- [ ] Payment processing
- [ ] Email triggers
- [ ] Notification systems
- [ ] Search functionality
- [ ] Pagination and filtering
- [ ] File uploads
- [ ] Webhook integrations

## References

- [Prisma 7 Migration Guide](https://pris.ly/d/migrate-to-prisma-7)
- [Prisma 7 Client Configuration](https://pris.ly/d/prisma7-client-config)
- [Prisma 7 Config](https://pris.ly/d/config-datasource)
- [Prisma 7 Breaking Changes](https://www.prisma.io/docs/orm/reference/prisma-config-reference)
