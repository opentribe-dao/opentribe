## Models:

- Bounty

## Constraints

- Use minimum and optimized db queries
- reuse code wherever you can
- cover all the edge cases and implement any and all checks necessary
- refer to `schema.prisma` for accurate db schema context

## Steps

- The cron job will run every half hour, so add an appropriate schedule in `vercel.json`
- Query for all bounties with `OPEN` status whose deadline has passed, handle timezone as well
- Update the bounties with status `REVIEWING`
- trigger emailers with email template `bounty-winner-reminder.tsx` using `packages/email`
- return the response with [id, title, deadline, submissionCount] for each bounty updated, along with a total overall count
