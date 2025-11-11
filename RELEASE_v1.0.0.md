# v1.0.0 Release Plan - Platform Launch

**Release Date:** November 2025
**Release Type:** Major Release - Platform Launch
**Previous Version:** v0.1.0
**Repository:** https://github.com/opentribe-dao/opentribe

---

## Table of Contents

1. [Overview](#overview)
2. [What's New in v1.0.0](#whats-new-in-v100)
3. [Release Process](#release-process)
4. [Deployment Configuration](#deployment-configuration)
5. [Verification & Testing](#verification--testing)
6. [Rollback Procedures](#rollback-procedures)
7. [Post-Release Tasks](#post-release-tasks)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Release Goals

- Document complete changelog of changes since v0.1.0
- Establish tag-based release process for immutable deployments
- Configure automated multi-project deployment to Vercel
- Launch production platform with legal compliance and enhanced features
- Maintain preview deployment functionality for development workflow

### Key Features

This release represents the transition from beta (v0.1.0) to production-ready platform with:

- ✅ GDPR-compliant cookie consent and legal pages
- ✅ Contact and support system
- ✅ Enhanced grant management workflow
- ✅ Comprehensive SEO and social sharing
- ✅ View tracking and analytics
- ✅ Refreshed email template system
- ✅ CI/CD pipeline for multi-project deployments

### Architecture

**Monorepo Structure:**
- `apps/web` → opentribe.io (public marketing site)
- `apps/dashboard` → dashboard.opentribe.io (authenticated dashboard)
- `apps/api` → api.opentribe.io (REST API)

**Deployment Strategy:**
- **Preview:** Vercel auto-deploys all PRs and branches
- **Production:** GitHub Actions deploys on version tags (v*.*.*)

---

## What's New in v1.0.0

### Added

**Contact & Support**
- New `/contact` page with comprehensive contact form
- New `/support` page for help and documentation
- Contact API endpoint (`/api/v1/contact`) for form submissions

**Cookie Consent Management**
- GDPR-compliant cookie consent banner
- Granular cookie preferences (strictly necessary, functional, analytics)
- Cookie policy page with detailed privacy controls
- Cookie settings management UI

**Share Functionality**
- Share button component for bounties, grants, and RFPs
- Social sharing integration across all opportunity pages

**Empty State Components**
- Informative empty states for bounties, grants, and RFPs
- Improved UX when no content available

**Grant Resource Files**
- Grant creators can attach resource files via URLs
- Enhanced resource handling in grant creation and updates

**View Tracking & Analytics**
- View count tracking for grants, bounties, submissions, and RFPs
- IP-based and user-based view tracking
- Automated cleanup of expired view records (cron job)
- Analytics capabilities for content creators

**Updated Branding**
- New Opentribe logomark integrated across platform
- Refreshed PWA icons and favicons (1024x1024)
- Updated logo components (Logo, Logomark, Wordmark) with appearance prop

### Changed

**Email Templates**
- Completely redesigned all 17 transactional email templates
- Inline SVG logos with brand-aligned gradient backgrounds
- Better visual hierarchy and mobile responsiveness
- Templates: Welcome, Verification, Password Reset, Bounty notifications, Grant updates, Org invites, Weekly digest

**Grant Management Flow**
- Complete refactor with stepper navigation
- Integrated react-hook-form for improved form handling
- Enhanced editing flow with dedicated forms
- Source selection (EXTERNAL vs NATIVE)
- Improved overview page layout and error handling

**SEO Enhancements**
- Comprehensive metadata updates across all pages
- Dynamic Open Graph images for social sharing
- Technical polish (viewport, theme-color, robots meta tags)
- Breadcrumbs, enhanced sitemap, article schema
- Dashboard-specific OG images and metadata

**Organization Switcher**
- Improved functionality and context switching

**Bounty Dashboard**
- Added screening questions display
- Enhanced resources display in review components
- Improved layout and configuration

### Fixed

**Authentication & Redirects**
- Fixed RFP detail page authentication issues
- Improved redirect logic after sign out (full window reload)

**Static Generation**
- Fixed dynamic cookies() call blocking static generation
- Added locale parameter to blog and legal pages

**OG Image Assets**
- Resolved font/asset paths for Vercel production
- Moved OG assets to public directory
- Standardized logo proportions in social previews

**API Visibility Filtering**
- Enforced visibility filter to show only "PUBLISHED" items
- Applied to bounties, grants, and RFPs endpoints

**Home Page Loading**
- Refined empty state logic for better loading handling

**Cookie Banner**
- Fully resolved merge conflicts in implementation

### Infrastructure

**Database & ORM**
- Updated Prisma to v6.19.0 with PrismaNeon adapter fixes
- Removed deprecated driverAdapters preview feature
- Added View model for analytics tracking

**API Monitoring & Observability**
- Enhanced API middleware with Sentry integration
- Detailed request/response logging with timing and size metrics
- Sensitive header redaction for security
- Improved health check API with detailed JSON responses and database latency

**Dependency Updates**
- lucide-react: 0.511.0 → 0.552.0
- @biomejs/biome: 2.2.7 → 2.3.2
- @prisma/adapter-neon: 6.4.1 → 6.18.0
- @content-collections/next: 0.2.8 → 0.2.9

**Code Quality**
- Repository-wide Biome linting and formatting applied
- Ultracite linting configuration v6.3.2

**Testing**
- Added comprehensive tests for ViewManager
- Enhanced health check API tests
- Updated tests across API endpoints

---

## Release Process

### Phase 1: Update Changelog

1. **Checkout changelog branch:**
   ```bash
   git checkout feat/changelog-v1.0.0
   git pull origin feat/changelog-v1.0.0
   git merge origin/main
   ```

2. **Update changelog file:**
   - File: `/apps/web/app/[locale]/changelog/page.tsx`
   - Add concise v1.0.0 entry with changes since v0.1.0
   - Keep descriptions brief and user-facing

3. **Commit and merge:**
   ```bash
   git add apps/web/app/[locale]/changelog/page.tsx
   git commit -m "docs: update v1.0.0 changelog with complete changes since v0.1.0"
   git push origin feat/changelog-v1.0.0
   git checkout main
   git merge feat/changelog-v1.0.0
   git push origin main
   ```

### Phase 2: Create GitHub Actions Workflow

1. **Create workflow file:**
   - File: `.github/workflows/deploy-production.yml`
   - See [Deployment Configuration](#deployment-configuration) for complete workflow

2. **Commit and push:**
   ```bash
   git add .github/workflows/deploy-production.yml
   git commit -m "ci: add tag-based multi-project production deployment workflow"
   git push origin main
   ```

### Phase 3: Configure Vercel Projects

**For each project (web, dashboard, api):**

1. **Verify Settings:**
   - Root Directory: `apps/web`, `apps/dashboard`, or `apps/api`
   - Framework Preset: Next.js
   - Build Command: Auto-detected
   - Install Command: `pnpm install`
   - Enable: "Include source files outside of the Root Directory"

2. **Configure Domains:**
   - Web: `opentribe.io`
   - Dashboard: `dashboard.opentribe.io`
   - API: `api.opentribe.io`

3. **Optional - Prevent Duplicate Tag Deployments:**
   - In Settings → Git → Ignored Build Step:
   ```bash
   git describe --exact-match --tags HEAD > /dev/null 2>&1 && exit 0 || exit 1
   ```

4. **Get Project IDs:**
   ```bash
   vercel login
   cd apps/web && vercel link && cd ../..
   cd apps/dashboard && vercel link && cd ../..
   cd apps/api && vercel link && cd ../..
   ```

   Copy IDs from `.vercel/project.json` files:
   - `orgId` → `VERCEL_ORG_ID` (same for all)
   - `projectId` → `VERCEL_*_PROJECT_ID` (different for each)

### Phase 4: Configure GitHub Secrets

Navigate to: Repository → Settings → Secrets and variables → Actions

**Add 5 secrets:**

1. `VERCEL_ORG_ID` - Organization ID (from `.vercel/project.json`)
2. `VERCEL_TOKEN` - Create at https://vercel.com/account/tokens (full access)
3. `VERCEL_WEB_PROJECT_ID` - Web project ID
4. `VERCEL_DASHBOARD_PROJECT_ID` - Dashboard project ID
5. `VERCEL_API_PROJECT_ID` - API project ID

### Phase 5: Create Git Tag & GitHub Release

1. **Create annotated tag:**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0 - Platform Launch

   Major Features:
   - Legal pages with GDPR-compliant cookie consent
   - Contact form and support system
   - Resource file uploads for grants
   - Comprehensive SEO enhancements
   - Enhanced email template system
   - Opentribe branding integration
   - View tracking and analytics
   - Grant creation workflow improvements

   Infrastructure:
   - Tag-based multi-project Vercel deployments
   - GitHub Actions CI/CD pipeline
   - Sentry and PostHog integrations"
   ```

2. **Push tag (triggers deployment):**
   ```bash
   git push origin v1.0.0
   ```

3. **Create GitHub Release:**
   ```bash
   gh release create v1.0.0 \
     --title "v1.0.0 - Platform Launch" \
     --notes "🚀 First production release of Opentribe - The talent marketplace for the Polkadot ecosystem.

   ## Highlights
   - Legal compliance (GDPR cookie consent, Privacy Policy, Terms)
   - Contact & Support system
   - Grant resource uploads
   - Comprehensive SEO
   - Enhanced email templates
   - Multi-project deployment pipeline

   See full changelog: https://opentribe.io/en/changelog

   ## Production URLs
   - Web: https://opentribe.io
   - Dashboard: https://dashboard.opentribe.io
   - API: https://api.opentribe.io" \
     --latest
   ```

---

## Deployment Configuration

### GitHub Actions Workflow

**File:** `.github/workflows/deploy-production.yml`

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*.*.*'

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}

jobs:
  deploy:
    name: Deploy ${{ matrix.app.name }}
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app:
          - name: web
            path: apps/web
            project_id: VERCEL_WEB_PROJECT_ID
          - name: dashboard
            path: apps/dashboard
            project_id: VERCEL_DASHBOARD_PROJECT_ID
          - name: api
            path: apps/api
            project_id: VERCEL_API_PROJECT_ID
      max-parallel: 1  # Deploy sequentially to avoid .vercel config conflicts

    steps:
      - name: Checkout code
        uses: actions/checkout@v5
        with:
          fetch-depth: 2

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment
        env:
          VERCEL_PROJECT_ID: ${{ secrets[matrix.app.project_id] }}
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        env:
          VERCEL_PROJECT_ID: ${{ secrets[matrix.app.project_id] }}
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        env:
          VERCEL_PROJECT_ID: ${{ secrets[matrix.app.project_id] }}
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Deployment Behavior

**Preview Deployments (Unchanged):**
- Trigger: Push to any branch or create PR
- Behavior: Vercel automatically builds and deploys previews
- URL: Unique preview URL (e.g., `app-git-feature-branch-org.vercel.app`)

**Production Deployments (New):**
- Trigger: Push version tag (e.g., `v1.0.0`)
- Behavior: GitHub Actions builds and deploys sequentially
- URL: Custom domains (opentribe.io, dashboard.opentribe.io, api.opentribe.io)
- Duration: ~6-15 minutes for all 3 apps

---

## Verification & Testing

### Monitor GitHub Actions

1. Navigate to: Repository → Actions → "Deploy to Production"
2. Verify all 3 matrix jobs complete successfully:
   - Deploy web
   - Deploy dashboard
   - Deploy api
3. Check deployment logs for any errors

### Verify Vercel Deployments

For each project in Vercel Dashboard:

1. **Check deployment source:**
   - Should show tag `v1.0.0`
   - Deployed via GitHub Actions (not auto-deploy)

2. **Verify status:**
   - Status: "Ready"
   - Build time: 2-5 minutes per app
   - No errors in build logs

3. **Confirm domains:**
   - Custom domains correctly assigned
   - SSL certificates active

### Production Testing Checklist

**Web (https://opentribe.io):**
- [ ] Homepage loads correctly
- [ ] Grant listings display
- [ ] Bounty listings display
- [ ] RFP listings display
- [ ] Cookie consent banner appears on first visit
- [ ] Contact form submits successfully
- [ ] Legal pages render (Privacy Policy, Terms, Cookie Policy)
- [ ] Share buttons work on opportunity pages
- [ ] OG images display correctly in social media previews
- [ ] Search functionality works

**Dashboard (https://dashboard.opentribe.io):**
- [ ] Login/authentication works
- [ ] Grant creation flow completes
- [ ] Bounty creation flow completes
- [ ] Organization switching works
- [ ] Profile settings update
- [ ] Grant applications review works
- [ ] Bounty submissions review works
- [ ] Organization settings accessible

**API (https://api.opentribe.io):**
- [ ] Health check responds: `GET /health`
- [ ] Public endpoints return data (grants, bounties, RFPs)
- [ ] Protected endpoints require authentication
- [ ] CORS headers present for cross-origin requests
- [ ] API rate limiting works
- [ ] Sentry captures errors correctly

### Performance Checks

- [ ] Core Web Vitals are within acceptable ranges
- [ ] Page load times < 3 seconds
- [ ] Time to Interactive < 5 seconds
- [ ] No console errors in browser
- [ ] Database queries optimized (< 100ms average)

---

## Rollback Procedures

### Option 1: Redeploy Previous Tag

```bash
# Push previous tag to trigger redeployment
git push origin v0.1.0 --force

# Or create a rollback tag
git tag -a v1.0.0-rollback -m "Rollback to v0.1.0"
git push origin v1.0.0-rollback
```

### Option 2: Vercel Dashboard

1. Go to Vercel Dashboard → Project → Deployments
2. Find the previous working deployment
3. Click "..." menu → "Promote to Production"
4. Confirm promotion

### Option 3: Vercel CLI

```bash
# List recent deployments
vercel ls --token=$VERCEL_TOKEN

# Rollback to specific deployment
vercel rollback [deployment-url] --token=$VERCEL_TOKEN
```

### Hotfix Procedure

If urgent fix needed:

1. Create hotfix branch from tag:
   ```bash
   git checkout -b hotfix/v1.0.1 v1.0.0
   ```

2. Make minimal fix and commit

3. Create patch tag:
   ```bash
   git tag -a v1.0.1 -m "Hotfix: [description]"
   git push origin v1.0.1
   ```

4. Deployment triggers automatically via GitHub Actions

---

## Post-Release Tasks

### Immediate (Within 24 hours)

- [ ] Monitor error tracking in Sentry
- [ ] Check PostHog analytics for unusual patterns
- [ ] Verify email deliverability (check spam folders)
- [ ] Respond to user feedback on social media
- [ ] Update status page if applicable

### Short-term (Within 1 week)

- [ ] Review production metrics and performance
- [ ] Collect user feedback on new features
- [ ] Document any issues encountered
- [ ] Plan v1.0.1 patch release if needed

### Cleanup

Add `.vercel` directories to .gitignore:

```bash
echo "" >> .gitignore
echo "# Vercel local config" >> .gitignore
echo ".vercel" >> .gitignore
git rm -r --cached apps/*/.vercel 2>/dev/null || true
git add .gitignore
git commit -m "chore: ignore .vercel directories"
git push origin main
```

---

## Troubleshooting

### Deployment Fails in GitHub Actions

**Check logs for specific error:**
```bash
# View workflow run
gh run list --workflow=deploy-production.yml
gh run view [run-id] --log
```

**Common issues:**

1. **Missing GitHub Secrets**
   - Verify all 5 secrets are set correctly
   - Check secret names match exactly

2. **Vercel Token Expired**
   - Regenerate token at https://vercel.com/account/tokens
   - Update `VERCEL_TOKEN` secret

3. **Project ID Mismatch**
   - Verify project IDs from `.vercel/project.json`
   - Ensure each app has correct project ID secret

4. **Build Failure**
   - Check if build passes locally: `pnpm build`
   - Review build logs in GitHub Actions
   - Verify environment variables in Vercel

### Duplicate Deployments

**Issue:** Both Vercel and GitHub Actions deploy the tag

**Solution:** Add Ignored Build Step in Vercel settings:
```bash
git describe --exact-match --tags HEAD > /dev/null 2>&1 && exit 0 || exit 1
```

### Preview Deployments Not Working

**Verify:**
- No `vercel.json` with `deploymentEnabled: false` exists
- Vercel Git integration is connected
- Branch protection rules don't block deployments

### Production URLs Not Working

**Check:**
- Custom domains configured in Vercel project settings
- DNS records point to Vercel (CNAME or A records)
- SSL certificates are active
- Domain verification completed

### API CORS Issues

**Verify:**
- CORS middleware configured in `apps/api/middleware.ts`
- Allowed origins include production URLs
- Preflight requests handled correctly

---

## Additional Resources

### Documentation Links

- [Vercel Monorepo Documentation](https://vercel.com/docs/monorepos/turborepo)
- [GitHub Actions Matrix Strategy](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)
- [Turborepo Documentation](https://turbo.build/repo/docs)

### Support Contacts

- Technical Issues: https://github.com/opentribe-dao/opentribe/issues
- Deployment Help: Vercel Support
- Community: [Discord/Slack Channel]

---

## Changelog History

- **v1.0.0** (November 2025) - Platform Launch
- **v0.1.0** (October 2025) - Initial Beta Release

---

## Sign-off

**Prepared by:** Claude Code
**Reviewed by:** [Team Member]
**Approved by:** [Project Lead]
**Date:** November 2025

---

**End of Release Plan**
