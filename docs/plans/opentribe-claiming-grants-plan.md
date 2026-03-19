# Opentribe Claiming, Grant Submission, and Seed Data Plan

## Summary
Implement a unified seeded-entity model for users, organizations, grants, and bounty/demo content, with explicit on-page claim flows instead of email-first onboarding. Seeded profiles, orgs, and grants should exist publicly as `unclaimed` records managed by platform admins until a real operator claims them. Grant applications should support both multiple separate submissions per user and revision history within each submission. Grant application visibility should be configurable per grant with a simple v1 choice: `public` or `private`.

## Key Changes
### 1. Seeded ownership and claim system
- Add a generic claim domain covering `user profile`, `organization`, and `grant`.
- Introduce claim state on seeded entities or via a shared claim table:
  - `unclaimed`
  - `claimed`
  - `pending_claim`
  - `rejected` or equivalent review outcome
- Add a `claim request` record with:
  - `entityType`
  - `entityId`
  - `requestingUserId`
  - `seededEmail`
  - `signedInEmail`
  - `status`
  - `verification state`
  - `approvedBy`
  - timestamps and audit notes
- Seed orgs/grants as public unclaimed records with no real owner member by default.
- Platform admins retain override/manage rights for all unclaimed seeded entities.

### 2. Claim UX and approval rules
- Public seeded user profiles show `Claim Your Profile`.
- Public organization pages show `Claim This Organization`.
- Public grant pages show `Claim This Grant` when the grant is unclaimed.
- Claim flow:
  - unauthenticated user clicks CTA
  - user signs in or signs up
  - system compares signed-in email to seeded email if present
  - exact match triggers auto-claim and merge/attach flow
  - mismatch creates a pending claim request
- For mismatch claims:
  - send verification/challenge to the seeded email if available
  - do not auto-merge or auto-transfer ownership
  - require approval from `platform admin` or existing `org owner/admin`
- Approval permissions:
  - user profile claim mismatch: platform admin
  - organization claim mismatch: platform admin or org owner/admin
  - grant claim mismatch: platform admin or org owner/admin of the owning org
- Reuse one claim engine across all entity types, with entity-specific approval rules and UI labels.

### 3. User profile model and merge behavior
- Treat the current `User` row as the editable account record, but support seeded/unclaimed profile ownership metadata.
- When a seeded profile is auto-claimed by email match:
  - merge seeded public profile fields into the authenticated account
  - preserve account auth identity
  - preserve attribution/audit history
  - resolve collisions explicitly with deterministic precedence
- Default merge precedence:
  - authenticated account identity fields remain canonical for auth
  - non-empty seeded profile content fills missing account profile fields
  - conflicting social/metadata fields are flagged for review instead of silently overwriting
- `Claim Your Profile` should only appear when the viewed profile is marked unclaimed and does not belong to the current account.

### 4. Grant application model changes
- Replace the current one-application-per-user-per-grant rule with:
  - many `application submissions` per user per grant
  - many `application revisions` per submission
- Keep `new submission` as an explicit user action.
- Editing a draft or submitted application creates a revision history entry on the existing submission.
- Recommended model split:
  - `GrantApplicationSubmission`: top-level application attempt
  - `GrantApplicationRevision`: immutable snapshots or versioned content entries
- Keep a stable top-level submission status for review workflows; store content/version history in revisions.
- Update API and UI behavior so grant detail pages no longer assume a single `userApplicationId`.
- Grant-level visibility setting:
  - `PUBLIC`
  - `PRIVATE`
- Public applications page should show submitted applications only when the grant's application visibility is `PUBLIC`.
- Private grants still allow org reviewers/admins to see applications in dashboard; public web routes should hide them.

### 5. Public surfaces and admin surfaces
- Add a public organization detail page with:
  - org metadata
  - grants
  - bounties
  - members
  - claim state
  - `Claim This Organization` CTA when eligible
- Update public grant detail page to:
  - show claim CTA if grant is unclaimed
  - support multiple submissions by the same signed-in user
  - link to a list of that user's submissions for the grant instead of a single application page
- Update public profile page to:
  - show claim CTA on unclaimed profiles
  - distinguish claimed vs unclaimed profile state where helpful
- Update dashboard/admin surfaces to support:
  - claim request review queue
  - approve/reject actions
  - seeded org/grant visibility and ownership state
  - management of unclaimed records
- Admin seed setup should include:
  - superadmin account
  - seeded unclaimed orgs
  - seeded grants under those orgs
  - seeded bounty/demo data under designated group accounts
  - seeded applications/submissions across several users and orgs

### 6. Real data onboarding and group seeding
- Build the initial active-org list as structured seed/import input rather than ad hoc manual creation.
- Each active org entry should include:
  - org identity fields
  - public contact email
  - claim email if different
  - initial grants and optionally bounties
  - claim status
- Dummy bounty data from group accounts should be clearly marked as demo/starter content but behave like real records in UI and admin.
- Seed data should cover:
  - claimed and unclaimed examples
  - same-email auto-claim path
  - mismatched-email pending claim path
  - grants with `public` and `private` applications
  - users with multiple submissions to one grant
  - revisions on at least one submission

## Public API / Interface Changes
- Add claim endpoints or server actions for:
  - start claim
  - verify claim
  - approve claim
  - reject claim
  - merge/attach claimed entity
- Update grant application APIs to return:
  - submission list for current user
  - revision history for a submission
  - grant-level application visibility state
- Remove the assumption that `GET /grants/:id` returns only one application pointer for the current user.
- Add organization public read endpoint for organization detail page.
- Extend admin/dashboard queries to include claim state and pending claim counts.

## Test Plan
- Seed tests:
  - unclaimed orgs/grants/profiles are created correctly
  - seeded relationships between orgs, grants, users, applications, and bounties are valid
- Claim flow tests:
  - unauthenticated click redirects into auth
  - same-email profile claim auto-claims successfully
  - mismatched-email profile claim creates pending request
  - org/grant claim approval allowed for platform admin and org owner/admin
  - unauthorized reviewer cannot approve claim
- Merge tests:
  - seeded profile fields merge without breaking auth identity
  - conflicting fields are preserved or flagged per chosen merge rules
- Grant application tests:
  - same user can create multiple separate submissions for one grant
  - editing a submission creates a revision, not a new submission
  - explicit `new submission` creates a second top-level submission
  - public/private grant visibility is enforced on public routes
- UI tests:
  - claim CTA renders only for unclaimed eligible entities
  - public org page renders seeded unclaimed org correctly
  - grant page handles multiple user submissions without single-application assumptions

## Assumptions and Defaults
- Seeded records are public and `unclaimed` by default.
- On-page claim CTA is the primary entrypoint; email is a verification step, not the first touchpoint.
- Same-email match is sufficient for auto-claim in v1.
- Email mismatch never auto-merges; it creates a pending claim request.
- Claim approval authority is:
  - platform admin for profile claims
  - platform admin or org owner/admin for org and grant claims
- Grant application visibility is set per grant and supports only `public` or `private` in v1.
- Multiple separate submissions and revision history are both required for grant applications.
- `New submission` is explicit; edits create revisions on the same submission.


## Codex Discussion 

My Question:  I want to discuss with you following
  points, first tell me what do you
  understand and help me understand each
  point step me step. Here is are the
  following points: 
  1. Setup grant orgs for seed.
  2. Setup grant submission for each org and user account for each user submission.
  3. Figure out multiple submissions for users.
  4. Setup emailers for claiming organisation.
  5. Setup emailers for claiming grants.
  6. Organisation detail page.
  7. Fix user profile and a claim your profile feature.
  8. Make grant application public.
  9. Create list of active orgs from our group and start creating accounts on Opentribe.
  10. Admin setup for Opentribe with seed data.
  11. set up dummy data for bounties from group account. 
  
  We are in discussion mode, do not make any code change.

Codex Response:
- Using brainstorming to turn this into a
  clear product/engineering plan before any
  implementation.

  What I understand from your 11 points is
  this: you’re trying to complete the core
  supply-side foundation of Opentribe so
  the platform can actually operate with
  seeded organizations, grant programs,
  user identities, claiming flows, public
  grant applications, admin visibility, and
  believable demo data.

  Step by step, here is how I interpret
  each point:

  1. Setup grant orgs for seed
     You want seed data for organizations
     that own or sponsor grants.
     This means the database should start
     with a realistic set of orgs already
     created, likely with names, slugs,
     logos, descriptions, and ownership/
     admin links.
  2. Setup grant submission for each org
     and user account for each user
     submission
     You want seeded grant applications/
     submissions tied correctly to both:

  - the organization that owns the grant
  - the user who submitted the application
    This is mainly about relational
    correctness and realistic test/demo
    coverage.

  3. Figure out multiple submissions for
     users
     You need a product rule here.
     Can one user submit multiple
     applications to the same grant?
     Can they submit to multiple grants?
     Can they submit revisions or versions?
     This point is less about seeding and
     more about application model +
     business rules.
  4. Setup emailers for claiming
     organisation
     You want an email flow that lets a
     real person claim ownership/control of
     an org record that already exists in
     the system.
     This usually means invite/claim
     tokens, expiry, and ownership transfer
     or verification.
  5. Setup emailers for claiming grants
     Similar to org claiming, but for grant
     ownership or grant management rights.
     This may mean a curator/admin can
     claim responsibility for a grant
     program that was pre-created by seed/
     admin setup.
  6. Organisation detail page
     You need a public or dashboard-facing
     page that shows one organization in
     full:
     profile, grants, bounties, members,
     links, and probably claim state if
     unclaimed.
  7. Fix user profile and a claim your
     profile feature
     Current user profiles likely exist but
     are incomplete or disconnected from
     identity/ownership.
     You want users to be able to claim a
     pre-existing profile and then manage
     it.
  8. Make grant application public
     You want grant applications visible
     publicly instead of only privately/
     admin-only.
     Important decision: fully public, or
     public after submission/approval, or
     public with some redacted fields.
  9. Create list of active orgs from our
     group and start creating accounts on
     Opentribe
     Operationally, this means building the
     real onboarding list from your actual
     ecosystem group and creating initial
     org accounts in the product.
     This is partly data ops, partly
     onboarding workflow.
  10. Admin setup for Opentribe with seed
     data
     You want an internal admin experience
     that works well against seeded data.
     This usually includes seeded
     superadmin, org management, grant
     management, claim review, and
     moderation visibility.
  11. set up dummy data for bounties from
     group account
     You want demo/staging-worthy bounty
     data created under a shared or group-
     owned account, so the marketplace
     feels populated and testable.

  The bigger structure behind these points
  is:

  - Data foundation: 1, 2, 11
  - Ownership/claiming: 4, 5, 7
  - Public-facing product surfaces: 6, 8
  - Operational rollout: 9, 10
  - Policy decision: 3

  My recommendation is to think about them
  in this order, because it reduces churn:

  1. Define ownership and submission rules
  2. Define seed data model
  3. Define claim flows
  4. Define public pages and visibility
  5. Define admin workflow
  6. Do real-world org onboarding

  The first decision that will drive
  several of the others is point 3.

  Question: for a single grant, should one
  user be allowed only one submission,
  multiple submissions as separate entries,
  or one submission with editable
  revisions/history?


› You've provided a very clear anddetailed
  interpretation of each point, and I
  agree with your analysis and
  recommendations. Your breakdown into the
  five categories (data foundation,
  ownership/claiming, public-facing
  surfaces, operational rollout, and
  policy decision) is particularly helpful
  for understanding the system
  architecture.
  Your specific decisions on the open
  questions:
  - Point 3 (multiple submissions):
  Allowing both multiple separate
  submissions AND editable revisions/
  history gives users maximum flexibility
  while maintaining a clear audit trail.
  - Point 8 (public applications): Giving
  organizations control over visibility
  (public by default, with options to hide
  until submission/approval or keep
  private) respects organizational
  preferences while maintaining
  transparency as the default.
  Your recommended implementation order
  makes sense - starting with ownership/
  submission rules (point 3) before
  defining data models ensures the schema
  will properly support the intended
  business logic.

  - Setup grant orgs forseed: Create
  initial organization records in the
  database with realistic data including
  names, slugs, logos, descriptions, and
  ownership/admin links for grant-
  sponsoring organizations.
  - Setup grant submission for each org
  and user account for each user
  submission: Establish correct relational
  links between grant submissions, the
  sponsoring organization that owns each
  grant, and the individual user accounts
  that submit applications, ensuring data
  integrity for testing and demonstration.
  - Figure out multiple submissions for
  users: Allow both multiple separate
  submissions to the same grant AND
  editable revisions/history for single
  submissions, providing flexibility while
  maintaining audit trails.


• The submission policy is now clear: the
  model needs both distinct submissions per
  grant and revision history within a
  submission. I’m moving to the next
  decision because it affects org claiming,
  grant claiming, admin workflows, and seed
  structure.

• That gives us a solid first rule:

  For grants, the platform should support:

  - multiple separate submissions by the
    same user to the same grant
  - revision/history within each submission
  - a clear audit trail so org admins can
    see both the submission set and the
    evolution of each one

  That implies two separate concepts in the
  product model:

  - submission record: a distinct
    application attempt
  - submission revision/history: edits,
    updates, or resubmissions within that
    attempt

  This is important because otherwise
  “multiple submissions” and “editing a
  submission” get mixed together and the
  system becomes hard to reason about.

  The next decision is about claiming
  ownership, because it shapes points 4, 5,
  7, 9, and 10:

  Should claiming be:

  1. Email invite/token based only
     Only people who receive a claim link
     can claim an org, grant, or profile.
  2. Self-serve claim request + admin
     approval
     A user can request to claim an org/
     grant/profile, and admin approves it.
  3. Hybrid
     Trusted seeded invites use email claim
     links, but users can also submit claim
     requests when no invite exists.

  My recommendation is Hybrid, because
  seeded data and real-world onboarding
  rarely stay perfectly aligned. It gives
  you a fast path for planned onboarding
  and a fallback path for missed cases.

  Which of those three do you want?


› I was thinking of not sending them an email, but rather making
  sure that you know we show a button on the page saying "Claim
  Your Profile." Then, if they claim it, we can ask them to sign
  up with the email and then the merge. If the email is the
  same, it means that it's the same user. If not, or maybe we
  can then send them an activation link on the email with the
  last digit last text. It should be hybrid, but I think maybe
  we have to make it more explicit.


• I’m grounding this in the existing product shape before locking
  the claim flow. I’m checking how profiles, orgs, grants, and
  auth are modeled now so the plan matches the repo instead of
  inventing a parallel system.

• Explored
  └ List db
    Search prisma|schema|seed|auth|profile|organization|grant|
           submission|application
    Search model User|model Organization|model Grant|model
           Submission|model Application|model Profile in db
    Search claim|claimed|profile|organization|grant|submission|
           application in apps

─────────────────────────────────────────────────────────────────

• I found two important repo facts that change the plan. The
  current system already has public profile pages and grant
  application pages, but the API still enforces one application
  per user per grant, so your new submission policy is a real
  model change, not just UI.

• Explored
  └ Read schema.prisma, route.ts

─────────────────────────────────────────────────────────────────

• The repo confirms there’s no generic claim system yet. Profiles
  are just the authenticated User record, orgs use invitations
  for membership, and grant applications are still modeled as one
  record per user without revision/history.

• Explored
  └ Read README.md, route.ts, seed-auth.ts

─────────────────────────────────────────────────────────────────

• Your direction is sensible: the primary UX should be on-page
  claiming, not email-first. Email should be the verification/
  ownership step behind the button, not the entrypoint.

• Questions 1/1 answered
  • When someone clicks `Claim Your Profile` on a seeded profile,
    what should happen if they sign up with an email that does
    not exactly match the seeded profile email?
    answer: Claim request (Recommended)

• That makes the hybrid flow explicit enough to design around.

  For Claim Your Profile, the clean v1 behavior is:

  1. Public seeded profile shows Claim Your Profile.
  2. User clicks it and is taken into auth if not signed in.
  3. After signup/sign-in, the system compares:
      - signed-in account email
      - seeded profile email, if one exists
  4. If emails match exactly:
      - mark as verified claim
      - merge seeded profile into the real account
      - preserve history/audit metadata
  5. If emails do not match:
      - do not auto-merge
      - create a pending claim request
      - send verification/challenge to the seeded email if
        available
      - require admin review or explicit proof before merge

  That gives you the button-led UX you want, while keeping email
  as a verification mechanism rather than the primary onboarding
  mechanism.

  The important product distinction is:

  - auto-claim: same email, low friction
  - claim request: different email, higher trust check
  - manual resolution: no seeded email or unclear ownership

  This is stronger than “send an email link sometimes,” because
  it makes the decision tree explicit and implementable.

  For orgs and grants, I recommend using the same pattern instead
  of inventing three separate claim systems:

  - Claim Your Profile
  - Claim This Organization
  - Claim This Grant

  All three should reuse the same underlying claim workflow, with
  different entity types and approval rules.

  Next decision: for Organization and Grant claims, who should be
  allowed to approve a mismatch or pending claim request?

  1. Platform admin only
  2. Platform admin + existing org owner/admin
  3. Auto-approve after seeded-email verification only

  My recommendation is Platform admin + existing org owner/admin,
  because it scales better once orgs are partially claimed.


› 2. Platform admin + existing org owner/admin


• That closes the approval authority: pending org/grant claims
  can be approved by platform admins and by existing org owners/
  admins. I’m now locking the visibility model for public
  applications, because that affects public pages, dashboard
  permissions, and seeded data defaults.

• Questions 1/1 answered
  • How should grant application visibility work at the grant
    level?
    answer: Grant-level setting (Recommended)

• The visibility scope is now clear: this should be controlled
  per grant, not globally per org. One more decision is needed so
  the implementation doesn’t invent policy later.

• Questions 1/1 answered
  • Which application visibility modes should v1 support for each
    grant?
    answer: Public and Private (Recommended)

• Good. That keeps v1 narrow: each grant will choose either
  public applications or private applications, without review-
  stage visibility or per-field redaction. The last major policy
  gap is how revision history should behave for multiple grant
  submissions.

• Questions 1/1 answered
  • For grant applications, what should count as a revision
    versus a new submission?
    answer: Manual new submission (Recommended)

• I have the core policy decisions. I’m doing one last
  exploration pass to confirm what already exists for
  organization pages and admin surfaces, so the plan can say
  “extend” versus “build new.”

• Explored
  └ Read page.tsx
    List web
    Search /organizations?/|organization

─────────────────────────────────────────────────────────────────

• One repo fact worth calling out: there is no public
  organization detail route yet, while grants and applications
  already have public pages. So the org page is a net-new public
  surface, and it’s the natural place for Claim This
  Organization. One last decision will keep that page and the
  seed strategy aligned.

• Questions 1/1 answered
  • How should seeded organizations and grants be represented
    before they are claimed by real operators?
    answer: Unclaimed records (Recommended)


